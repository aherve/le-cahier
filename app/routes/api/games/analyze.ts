import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import type { LichessGame } from '~/schemas/lichess'
import { LICHESS_USERNAME } from '~/schemas/lichess'
import { LichessGameSchema } from '~/schemas/lichess'

import cache from 'memory-cache'
import type { GameReport } from '~/schemas/game-report'
import { ReportStatusSchema } from '~/schemas/game-report'
import { ChessBookService } from '~/services/chess-book'
import type { Color } from 'chess.js'

export const loader: LoaderFunction = async ({ request }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    throw new Error('Missing id')
  }

  const cachedGame = cache.get(id)
  if (!cachedGame) {
    throw new Error('Game not found in cache')
  }

  const game = LichessGameSchema.parse(cachedGame)

  console.log(`analyzing game ${game.id} for player ${LICHESS_USERNAME}`)

  const analysis = await analyzeGame(
    game,
    game.players.white.user.name === LICHESS_USERNAME ? 'w' : 'b'
  )

  return json(analysis)
}

async function analyzeGame(
  game: LichessGame,
  forColor: Color
): Promise<GameReport> {
  const movesReport = await Promise.all(
    game.moves.map(async (move) => {
      if (move.color !== forColor) {
        return { status: ReportStatusSchema.enum.opponentMove, bookMoves: [] }
      }

      const position = await ChessBookService.getPosition(move.before)
      if (
        !position ||
        !position.bookMoves ||
        !Object.keys(position.bookMoves).length
      ) {
        return { status: ReportStatusSchema.enum.notFound }
      }

      if (move.lan in position.bookMoves) {
        return {
          status: ReportStatusSchema.enum.success,
        }
      }

      return {
        status: ReportStatusSchema.enum.failed,
        expected: Object.keys(position.bookMoves),
        played: move.san,
      }
    })
  )

  const firstErrorIndex = movesReport.findIndex(
    (r) => r.status === ReportStatusSchema.enum.failed
  )
  const firstOutOfBookIndex = movesReport.findIndex(
    (r) => r.status === ReportStatusSchema.enum.notFound
  )

  return {
    gameId: game.id,
    movesReport: movesReport.filter(
      (r) => r.status !== ReportStatusSchema.enum.notFound
    ),
    firstError: firstErrorIndex > -1 ? game.moves[firstErrorIndex] : undefined,
    firstOutOfBook:
      firstOutOfBookIndex > -1 ? game.moves[firstOutOfBookIndex] : undefined,
  }
}
