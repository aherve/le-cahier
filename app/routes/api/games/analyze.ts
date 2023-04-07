import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import type { LichessGame } from '~/schemas/lichess'
import { LICHESS_USERNAME } from '~/schemas/lichess'

import type { GameReport } from '~/schemas/game-report'
import { ReportStatusSchema } from '~/schemas/game-report'
import { ChessBookService } from '~/services/chess-book'
import type { Color } from 'chess.js'
import { Chess } from 'chess.js'

export const loader: LoaderFunction = async ({ request }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    throw new Error('Missing id')
  }

  const existing = await ChessBookService.getGame(id)
  if (!existing) {
    throw new Error('No entry found in the db')
  }

  const { game, report } = existing
  if (!game) {
    throw new Error('No game found in the db')
  }

  if (report) {
    return json(report)
  }

  const newReport = await analyzeGame(
    game,
    game.players.white.user.name === LICHESS_USERNAME ? 'w' : 'b'
  )

  await ChessBookService.setReport(newReport)

  return json(newReport)
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
        expected: Object.keys(position.bookMoves).map((m) =>
          toSAN(move.before, m)
        ),
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

function toSAN(fen: string, move: string) {
  const m = new Chess(fen).move(move)
  return m.san
}