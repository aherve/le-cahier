import type {
  AttributeValue,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import type { Move } from 'chess.js';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';
import type { SaveMoveInput } from '~/routes/api.moves.create';
import type { AdminReport } from '~/schemas/admin-report';
import type { GameReport } from '~/schemas/game-report';
import type { LichessGame } from '~/schemas/lichess';
import type { BookPosition } from '~/schemas/position';

import { DynamoDB, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from 'chess.js';
import cache from 'memory-cache';

import { listUsers } from './auth.server';
import { inOneMonthUnix, stripFEN } from './utils';

import { GameReportSchema } from '~/schemas/game-report';
import { LichessGameSchema } from '~/schemas/lichess';
import { BookPositionSchema, BookMoveSchema } from '~/schemas/position';

export class ChessBook {
  private positionTableName: string;
  private gameTableName: string;
  private dynCli: DynamoDB;
  private ankiIndexName: string;
  constructor() {
    const region = 'eu-west-1';
    this.dynCli = new DynamoDB({ region });
    this.positionTableName = 'le-cahier-positions';
    this.gameTableName = 'le-cahier-games';
    this.ankiIndexName = 'ankiScoreIndex';
  }

  public async addComment(input: {
    fen: string;
    userId: string;
    comment: string;
    orientation: BoardOrientation;
  }) {
    await this.dynCli.updateItem({
      TableName: this.positionTableName,
      Key: marshall({
        fen: stripFEN(input.fen),
        userId: input.userId,
      }),
      UpdateExpression: 'set #comment = :comment',
      ExpressionAttributeNames: {
        '#comment':
          input.orientation === 'white' ? 'commentForWhite' : 'commentForBlack',
      },
      ExpressionAttributeValues: {
        ':comment': { S: trimComment(input.comment) },
      },
    });
  }
  public async deleteMove(input: {
    fen: string;
    move: Move;
    userId: string;
    isOpponentMove: boolean;
  }) {
    await this.dynCli.updateItem({
      TableName: this.positionTableName,
      Key: marshall({
        fen: stripFEN(input.fen),
        userId: input.userId,
      }),
      UpdateExpression: 'REMOVE #key.#move',
      ExpressionAttributeNames: {
        '#key': input.isOpponentMove ? 'opponentMoves' : 'bookMoves',
        '#move': input.move.lan,
      },
    });
  }
  public async addMove(input: SaveMoveInput & { userId: string }) {
    let { isOpponentMove, fen, move } = input;

    console.log('adding move', input);

    const game = new Chess(fen);

    game.move(move);
    const bookMove = BookMoveSchema.parse({
      targetFEN: stripFEN(game.fen()),
    });
    const path = isOpponentMove ? 'opponentMoves' : 'bookMoves';

    try {
      let updateExpr = 'SET #path = :move, #ankiScore = :zero';
      const attrNames: Record<string, string> = {
        '#path': path,
        '#ankiScore': 'ankiScore',
      };
      const attrValues: Record<string, AttributeValue> = {
        ':zero': { N: '0' },
        ':move': {
          M: {
            [move]: {
              M: marshall(bookMove, { removeUndefinedValues: true }),
            },
          },
        },
      };
      await this.dynCli.updateItem({
        TableName: this.positionTableName,
        Key: marshall({
          fen: stripFEN(fen),
          userId: input.userId,
        }),
        UpdateExpression: updateExpr,
        ConditionExpression: 'attribute_not_exists(#path)',
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: attrValues,
      });
    } catch {
      let updateExpr = 'SET #path.#move = :move';
      const attrNames: Record<string, string> = {
        '#path': path,
        '#move': move,
      };
      const attrValues: Record<string, AttributeValue> = {
        ':move': { M: marshall(bookMove, { removeUndefinedValues: true }) },
      };

      const update = {
        TableName: this.positionTableName,
        Key: marshall({
          fen: stripFEN(fen),
          userId: input.userId,
        }),
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: attrValues,
      };
      await this.dynCli.updateItem(update);
    }
  }

  public async getPosition(
    fen: string,
    userId: string,
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

  public async getAnki(userId: string, skipNovelties: boolean) {
    // find positions with ankiScore >= -1
    const anyPosition = await this.dynCli.query({
      TableName: this.positionTableName,
      IndexName: this.ankiIndexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
      Limit: 1,
    });

    if (!anyPosition.Items || anyPosition.Items.length === 0) {
      return undefined;
    }
    const found = BookPositionSchema.parse(unmarshall(anyPosition.Items[0]));
    if (found.ankiScore !== 0 || !skipNovelties) {
      return found;
    }

    // We didn't return => found is 0 and we want to skip novelties. Next item to find has to be > 0
    const playedPosition = await this.dynCli.query({
      TableName: this.positionTableName,
      IndexName: this.ankiIndexName,
      KeyConditionExpression: 'userId = :userId AND ankiScore > :zero',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':zero': { N: '0' },
      },
      Limit: 1,
    });
    if (!playedPosition.Items || playedPosition.Items.length === 0) {
      return undefined;
    }
    return BookPositionSchema.parse(unmarshall(playedPosition.Items[0]));
  }

  public async updateAnki(input: {
    fen: string;
    userId: string;
    isSuccess: boolean;
  }) {
    await this.dynCli.updateItem({
      TableName: this.positionTableName,
      Key: marshall({
        fen: stripFEN(input.fen),
        userId: input.userId,
      }),
      ConditionExpression: 'attribute_exists(fen)',
      UpdateExpression: input.isSuccess
        ? 'ADD ankiScore :two'
        : 'SET ankiScore = :minusOne',
      ExpressionAttributeValues: input.isSuccess
        ? { ':two': { N: '2' } }
        : { ':minusOne': { N: '-1' } },
    });
  }

  public async getRandomOpponentMove(
    fen: string,
    userId: string,
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
    userId: string,
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
      UpdateExpression: 'SET #report = :report, #TTL = :TTL',
      ExpressionAttributeNames: {
        '#report': 'report',
        '#TTL': 'TTL',
      },
      ExpressionAttributeValues: {
        ':report': { M: marshall(report, { removeUndefinedValues: true }) },
        ':TTL': { N: inOneMonthUnix().toString() },
      },
    });
    console.log(`report ${report.gameId} saved`);
  }
  public async setGame(game: LichessGame, userId: string) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId: game.id, userId }),
      TableName: this.gameTableName,
      UpdateExpression: 'SET #game = :game, #TTL = :TTL',
      ExpressionAttributeNames: {
        '#game': 'game',
        '#TTL': 'TTL',
      },
      ExpressionAttributeValues: {
        ':game': { M: marshall(game, { removeUndefinedValues: true }) },
        ':TTL': { N: inOneMonthUnix().toString() },
      },
    });
    console.log(`game ${game.id} saved`);
  }

  public async linkGraph(userId: string) {
    // Build map of all moves. Warning, this is expensive $$$
    let newTransposition = 0;
    let deadEnds = 0;
    let positionScanned = 0;
    const scanner = this.positionScanner(userId);
    const allPositions: Record<string, BookPosition> = {};
    const savePromises: Promise<void>[] = [];
    for await (const item of scanner) {
      allPositions[stripFEN(item.fen)] = item;
    }

    // Find transpositions
    for (const position of Object.values(allPositions)) {
      await Promise.resolve(); // This loop is cpu-intensive. Don't block the event loop for too long
      positionScanned++;
      const newOpponentMoves = new Chess(position.fen)
        .moves({ verbose: true })
        .filter((m) => !(m.lan in position.opponentMoves));

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
            }),
          );
        } else {
          deadEnds++;
        }
      }
    }
    await Promise.all(savePromises);
    const res = {
      newTransposition,
      deadEnds,
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

  public async adminReport(): Promise<AdminReport> {
    const users = await listUsers();
    const res: AdminReport['usage'] = {};
    for await (const pos of this.positionScanner()) {
      const opponentMoves = Object.keys(pos.opponentMoves).length;
      const bookMoves = Object.keys(pos.bookMoves).length;
      const username = users[pos.userId] ?? pos.userId;

      let comments = 0;
      if (pos.commentForBlack && pos.commentForBlack.length > 0) {
        comments++;
      }
      if (pos.commentForWhite && pos.commentForWhite.length > 0) {
        comments++;
      }

      res[username] ??= {
        positions: 0,
        opponentMoves: 0,
        bookMoves: 0,
        comments: 0,
      };
      res[username].positions += 1;
      res[username].opponentMoves += opponentMoves;
      res[username].bookMoves += bookMoves;
      res[username].comments += comments;
    }

    return {
      usage: res,
      totalUsers: Object.keys(users).length,
    };
  }

  private async *positionScanner(userId?: string) {
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
    do {
      const params: ScanCommandInput = {
        TableName: this.positionTableName,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      if (userId) {
        params.FilterExpression = '#userId = :userId';
        params.ExpressionAttributeNames = {
          '#userId': 'userId',
        };
        params.ExpressionAttributeValues = {
          ':userId': { S: userId },
        };
      }

      const { Items, LastEvaluatedKey } = await this.dynCli.send(
        new ScanCommand(params),
      );
      lastEvaluatedKey = LastEvaluatedKey;
      for (const item of Items ?? []) {
        yield BookPositionSchema.parse(unmarshall(item));
      }
    } while (lastEvaluatedKey);
  }
}

export const ChessBookService = new ChessBook();

function trimComment(comment: string) {
  const res = comment.replaceAll('[diagram]', '').trim();
  return res;
}
