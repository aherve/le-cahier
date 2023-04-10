import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import { DynamoDB, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Chess } from "chess.js";
import type { SaveMoveInput } from "~/routes/api/moves/create";
import type { GameReport } from "~/schemas/game-report";
import { GameReportSchema } from "~/schemas/game-report";
import type { LichessGame } from "~/schemas/lichess";
import { LichessGameSchema } from "~/schemas/lichess";
import type { BookPosition } from "~/schemas/position";
import { BookPositionSchema } from "~/schemas/position";
import { BookMoveSchema } from "~/schemas/position";
import { stripFEN } from "./utils";

export class ChessBook {
  private tableName: string;
  private gameTableName: string;
  private dynCli: DynamoDB;
  constructor() {
    const region = process.env.AWS_REGION ?? "eu-west-1";
    this.dynCli = new DynamoDB({ region });
    this.tableName = process.env.CHESS_BOOK_TABLE ?? "le-cahier";
    this.gameTableName = process.env.GAME_TABLE ?? "le-cahier-games";
  }

  public async addMove(input: SaveMoveInput) {
    const { isOpponentMove, fen, move } = input;
    console.log("adding move", input);

    const game = new Chess(fen);
    game.move(move);
    const bookMove = BookMoveSchema.parse({
      targetFEN: stripFEN(game.fen()),
    });
    const path = isOpponentMove ? "opponentMoves" : "bookMoves";

    try {
      await this.dynCli.updateItem({
        TableName: this.tableName,
        Key: marshall({ fen: stripFEN(fen) }),
        UpdateExpression: `SET #path = :move`,
        ConditionExpression: `attribute_not_exists(#path)`,
        ExpressionAttributeNames: {
          "#path": path,
        },
        ExpressionAttributeValues: {
          ":move": {
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
        TableName: this.tableName,
        Key: marshall({ fen: stripFEN(fen) }),
        UpdateExpression: `SET #path.#move = :move`,
        ExpressionAttributeNames: {
          "#path": path,
          "#move": move,
        },
        ExpressionAttributeValues: {
          ":move": { M: marshall(bookMove, { removeUndefinedValues: true }) },
        },
      };
      await this.dynCli.updateItem(update);
    }
  }

  public async getPosition(fen: string): Promise<BookPosition | null> {
    const key = stripFEN(fen);

    const data = await this.dynCli.getItem({
      TableName: this.tableName,
      Key: marshall({ fen: key }),
    });

    const result = data.Item
      ? BookPositionSchema.parse(unmarshall(data.Item))
      : null;

    return result;
  }

  public async getRandomOpponentMove(
    fen: string
  ): Promise<{ move: string; targetFEN: string } | null> {
    const position = await this.getPosition(fen);
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
    gameId: string
  ): Promise<{ game?: LichessGame; report?: GameReport } | null> {
    const data = await this.dynCli.getItem({
      TableName: this.gameTableName,
      Key: marshall({ gameId }),
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
  public async setReport(report: GameReport) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId: report.gameId }),
      TableName: this.gameTableName,
      UpdateExpression: `SET #report = :report`,
      ExpressionAttributeNames: {
        "#report": "report",
      },
      ExpressionAttributeValues: {
        ":report": { M: marshall(report, { removeUndefinedValues: true }) },
      },
    });
    console.log(`report ${report.gameId} saved`);
  }
  public async setGame(game: LichessGame) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId: game.id }),
      TableName: this.gameTableName,
      UpdateExpression: `SET #game = :game`,
      ExpressionAttributeNames: {
        "#game": "game",
      },
      ExpressionAttributeValues: {
        ":game": { M: marshall(game, { removeUndefinedValues: true }) },
      },
    });
    console.log(`game ${game.id} saved`);
  }

  public async linkGraph() {
    // Build map of all moves. Warning, this is expensive $$$
    let newTransposition = 0;
    let leadsToUnknownPosition = 0;
    let alreadyRegistered = 0;
    const scanner = this.dbScanner();
    const allPositions: Record<string, BookPosition> = {};
    const savePromises: Promise<void>[] = [];
    for await (const items of scanner) {
      if (!items) {
        continue;
      }

      for (const item of items) {
        const parsed = BookPositionSchema.parse(unmarshall(item));
        allPositions[parsed.fen] = parsed;
      }
    }

    // Find transpositions
    for (const position of Object.values(allPositions)) {
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
              isOpponentMove: true,
              move: newMove.lan,
            })
          );
        } else {
          leadsToUnknownPosition++;
        }
      }
    }
    console.log({
      newTransposition,
      leadsToUnknownPosition,
      alreadyRegistered,
    });
    await Promise.all(savePromises);
  }

  public async cleanGameReport(gameId: string) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId }),
      TableName: this.gameTableName,
      UpdateExpression: `REMOVE #report`,
      ExpressionAttributeNames: {
        "#report": "report",
      },
    });
  }

  private async *dbScanner() {
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
    do {
      const { Items, LastEvaluatedKey } = await this.dynCli.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
      lastEvaluatedKey = LastEvaluatedKey;
      yield Items;
    } while (lastEvaluatedKey);
  }
}

export const ChessBookService = new ChessBook();
