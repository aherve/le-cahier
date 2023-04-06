import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { Chess } from 'chess.js'
import { z } from 'zod'
import type { SaveMoveInput } from '~/routes/api/moves/create'
import type { LichessGame } from '~/schemas/lichess'
import { LichessGameSchema } from '~/schemas/lichess'
import { stripFEN } from './utils'

export const BookMoveSchema = z.object({
  targetFEN: z.string(),
})
export type BookMove = z.infer<typeof BookMoveSchema>
export const BookPositionSchema = z.object({
  fen: z.string(),
  bookMoves: z.record(z.string(), BookMoveSchema).default({}),
  opponentMoves: z.record(z.string(), BookMoveSchema).default({}),
})
export type BookPosition = z.infer<typeof BookPositionSchema>

export class ChessBook {
  private tableName: string
  private gameTableName: string
  private dynCli: DynamoDB
  constructor() {
    const region = process.env.AWS_REGION ?? 'eu-west-1'
    this.dynCli = new DynamoDB({ region })
    this.tableName = process.env.CHESS_BOOK_TABLE ?? 'le-cahier'
    this.gameTableName = process.env.GAME_TABLE ?? 'le-cahier-games'
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
    const key = stripFEN(fen)

    const data = await this.dynCli.getItem({
      TableName: this.tableName,
      Key: marshall({ fen: key }),
    })

    const result = data.Item
      ? BookPositionSchema.parse(unmarshall(data.Item))
      : null

    return result
  }

  public async getRandomOpponentMove(
    fen: string
  ): Promise<{ move: string; targetFEN: string } | null> {
    const position = await this.getPosition(fen)
    if (!position) {
      return null
    }
    const opponentMoves = position.opponentMoves
    const moveList = Object.keys(opponentMoves)
    if (moveList.length === 0) {
      return null
    }
    const randomIndex = Math.floor(Math.random() * moveList.length)
    return {
      move: moveList[randomIndex],
      targetFEN: opponentMoves[moveList[randomIndex]].targetFEN,
    }
  }

  public async getGame(gameId: string): Promise<LichessGame | null> {
    const data = await this.dynCli.getItem({
      TableName: this.gameTableName,
      Key: marshall({ gameId }),
    })
    const result = data.Item
      ? LichessGameSchema.parse(unmarshall(data.Item).game)
      : null
    return result
  }
  public async setGame(game: LichessGame) {
    await this.dynCli.updateItem({
      Key: marshall({ gameId: game.id }),
      TableName: this.gameTableName,
      UpdateExpression: `SET #game = :game`,
      ExpressionAttributeNames: {
        '#game': 'game',
      },
      ExpressionAttributeValues: {
        ':game': { M: marshall(game, { removeUndefinedValues: true }) },
      },
    })
    console.log(`game ${game.id} saved`)
  }
}

export const ChessBookService = new ChessBook()
