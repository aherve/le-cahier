import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { Chess } from 'chess.js'
import type { SaveMoveInput } from '~/routes/api/moves/create'
import type { BookPosition } from './chess-book'
import { BookMoveSchema, BookPositionSchema } from './chess-book'
import { stripFEN } from './utils'

export class DynamoChessBook {
  private tableName: string
  private dynCli: DynamoDB
  constructor() {
    const region = process.env.AWS_REGION ?? 'eu-west-1'
    this.dynCli = new DynamoDB({ region })
    this.tableName = process.env.CHESS_BOOK_TABLE ?? 'le-cahier'
  }

  public async addMove(input: SaveMoveInput) {
    const { isOpponentMove, fen, move } = input
    console.log('adding move', input)

    const game = new Chess(fen)
    game.move(move)
    const bookMove = BookMoveSchema.parse({
      targetFEN: stripFEN(game.fen()),
    })
    const path = isOpponentMove ? 'opponentMoves' : 'bookMoves'

    try {
      await this.dynCli.updateItem({
        TableName: this.tableName,
        Key: marshall({ fen: stripFEN(fen) }),
        UpdateExpression: `SET #path = :move`,
        ConditionExpression: `attribute_not_exists(#path)`,
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
      })
    } catch {
      const update = {
        TableName: this.tableName,
        Key: marshall({ fen: stripFEN(fen) }),
        UpdateExpression: `SET #path.#move = :move`,
        ExpressionAttributeNames: {
          '#path': path,
          '#move': move,
        },
        ExpressionAttributeValues: {
          ':move': { M: marshall(bookMove, { removeUndefinedValues: true }) },
        },
      }
      console.log('update', update)
      await this.dynCli.updateItem(update)
    }
  }

  public async getPosition(fen: string): Promise<BookPosition | null> {
    const data = await this.dynCli.getItem({
      TableName: this.tableName,
      Key: marshall({ fen: stripFEN(fen) }),
    })
    if (!data.Item) {
      return null
    }
    return BookPositionSchema.parse(unmarshall(data.Item))
  }
}

export const DynamoChessBookService = new DynamoChessBook()
