import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type { SaveMoveInput } from '~/routes/api/moves/create';
import type { GameReport } from '~/schemas/game-report';
import type { LichessGame } from '~/schemas/lichess';
import type { BookPosition } from '~/schemas/position';

import { DynamoDB, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from 'chess.js';
import cache from 'memory-cache';

import { stripFEN } from './utils';

import { GameReportSchema } from '~/schemas/game-report';
import { LichessGameSchema } from '~/schemas/lichess';
import { BookPositionSchema, BookMoveSchema } from '~/schemas/position';

export class ChessBook {
  private positionTableName: string;
  private gameTableName: string;
  private dynCli: DynamoDB;
  constructor() {
    const region = 'eu-west-1';
    this.dynCli = new DynamoDB({ region });
    this.positionTableName = 'le-cahier-positions';
    this.gameTableName = 'le-cahier-games';
  }

  public async addMove(input: SaveMoveInput & { userId: string }) {
    const { isOpponentMove, fen, move } = input;
    console.log('adding move', input);

    const game = new Chess(fen);
    game.move(move);
    const bookMove = BookMoveSchema.parse({
      targetFEN: stripFEN(game.fen()),
    });
    const path = isOpponentMove ? 'opponentMoves' : 'bookMoves';

    try {
      await this.dynCli.updateItem({
        TableName: this.positionTableName,
        Key: marshall({
          fen: stripFEN(fen),
          userId: input.userId,
        }),
        UpdateExpression: 'SET #path = :move',
        ConditionExpression: 'attribute_not_exists(#path)',
        ExpressionAttributeNames: {
          '#path': path,
        },
        ExpressionAttributeValues: {
          ':move': {
            M: {
              [move]: {
                M: marshall(bookMove, { removeUndefinedValues: true }),
              },
            },
          },
        },
      });
    } catch {
      const update = {
        TableName: this.positionTableName,
        Key: marshall({
          fen: stripFEN(fen),
          userId: input.userId,
        }),
        UpdateExpression: 'SET #path.#move = :move',
        ExpressionAttributeNames: {
          '#path': path,
          '#move': move,
        },
        ExpressionAttributeValues: {
          ':move': { M: marshall(bookMove, { removeUndefinedValues: true }) },
        },
      };
      await this.dynCli.updateItem(update);
    }
  }

  public async getPosition(
    fen: string,
    userId: string
  ): Promise<BookPosition | null> {
    const key = stripFEN(fen);
    const cacheKey = `position-${key}-${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('position cache hit');
      return cached;
    }

    const data = await this.dynCli.getItem({
      TableName: this.positionTableName,
      Key: marshall({ fen: key, userId }),
    });

    const result = data.Item
      ? BookPositionSchema.parse(unmarshall(data.Item))
      : null;

    cache.put(cacheKey, result, 10_000);
    return result;
  }

  public async getRandomOpponentMove(
    fen: string,
    userId: string
  ): Promise<{ move: string; targetFEN: string } | null> {
    const position = await this.getPosition(fen, userId);
    if (!position) {
      return null;
    }
    const opponentMoves = position.opponentMoves;
    const moveList = Object.keys(opponentMoves);
    if (moveList.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * moveList.length);
    return {
      move: moveList[randomIndex],
      targetFEN: opponentMoves[moveList[randomIndex]].targetFEN,
    };
  }

  public async getGame(
    gameId: string,
    userId: string
  ): Promise<{ game?: LichessGame; report?: GameReport } | null> {
    const data = await this.dynCli.getItem({
      TableName: this.gameTableName,
      Key: marshall({ gameId, userId }),
    });

    if (!data.Item) {
      return null;
    }
    const raw = unmarshall(data.Item);

    return {
      game: LichessGameSchema.optional().parse(raw.game),
      report: GameReportSchema.optional().parse(raw.report),
    };
  }
  public async setReport(report: GameReport, userId: string) {
    await this.dynCli.updateItem({
      Key: marshall({
        gameId: report.gameId,
        userId,
      }),
      TableName: this.gameTableName,
      UpdateExpression: 'SET #report = :report',
      ExpressionAttributeNames: {
        '#report': 'report',
      },
      ExpressionAttributeValues: {
        ':report': { M: marshall(report, { removeUndefinedValues: true }) },
      },
    });
    console.log(`report ${report.gameId} saved`);
  }
  public async setGame(game: LichessGame, userId: string) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId: game.id, userId }),
      TableName: this.gameTableName,
      UpdateExpression: 'SET #game = :game',
      ExpressionAttributeNames: {
        '#game': 'game',
      },
      ExpressionAttributeValues: {
        ':game': { M: marshall(game, { removeUndefinedValues: true }) },
      },
    });
    console.log(`game ${game.id} saved`);
  }

  public async linkGraph(userId: string) {
    // Build map of all moves. Warning, this is expensive $$$
    let newTransposition = 0;
    let deadEnds = 0;
    let alreadyRegistered = 0;
    let positionScanned = 0;
    const scanner = this.positionScanner(userId);
    const allPositions: Record<string, BookPosition> = {};
    const savePromises: Promise<void>[] = [];
    for await (const item of scanner) {
      allPositions[stripFEN(item.fen)] = item;
    }

    // Find transpositions
    for (const position of Object.values(allPositions)) {
      positionScanned++;
      const allOpponentMoves = new Chess(position.fen).moves({ verbose: true });
      const newOpponentMoves = allOpponentMoves.filter(
        (m) => !(m.lan in position.opponentMoves)
      );
      alreadyRegistered += allOpponentMoves.length - newOpponentMoves.length;

      for (const newMove of newOpponentMoves) {
        const newFen = stripFEN(newMove.after);

        if (
          newFen in allPositions &&
          Object.keys(allPositions[newFen].bookMoves).length > 0
        ) {
          newTransposition++;
          savePromises.push(
            this.addMove({
              fen: stripFEN(position.fen),
              userId,
              isOpponentMove: true,
              move: newMove.lan,
            })
          );
        } else {
          deadEnds++;
        }
      }
    }
    await Promise.all(savePromises);
    const res = {
      newTransposition,
      leadsToUnknownPosition: deadEnds,
      alreadyRegistered,
      positionScanned,
    };
    console.log(res);
    return res;
  }

  public async cleanGameReport(gameId: string, userId: string) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId, userId }),
      TableName: this.gameTableName,
      UpdateExpression: 'REMOVE #report',
      ExpressionAttributeNames: {
        '#report': 'report',
      },
    });
  }

  private async *positionScanner(userId: string) {
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
    do {
      const { Items, LastEvaluatedKey } = await this.dynCli.send(
        new ScanCommand({
          TableName: this.positionTableName,
          ExclusiveStartKey: lastEvaluatedKey,
          FilterExpression: '#userId = :userId',
          ExpressionAttributeNames: {
            '#userId': 'userId',
          },
          ExpressionAttributeValues: {
            ':userId': { S: userId },
          },
        })
      );
      lastEvaluatedKey = LastEvaluatedKey;
      for (const item of Items ?? []) {
        yield BookPositionSchema.parse(unmarshall(item));
      }
    } while (lastEvaluatedKey);
  }
}

export const ChessBookService = new ChessBook();
