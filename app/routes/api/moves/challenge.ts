import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { z } from 'zod'
import { ChessBookService } from '~/services/chess-book'

export const GetChallengeOutputSchema = z.object({
  challengeMove: z.string().nullable(),
  expectedMoves: z.string().array(),
})
export type GetChallengeOutput = z.infer<typeof GetChallengeOutputSchema>

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const fen = url.searchParams.get('fen')
  if (!fen) {
    throw new Error('Missing fen')
  }

  const move = await ChessBookService.getRandomOpponentMove(fen)
  if (!move) {
    return json({ challengeMove: null, expectedMoves: [] })
  }

  const nextPos = await ChessBookService.getPosition(move.targetFEN)

  const resp: GetChallengeOutput = {
    challengeMove: move?.move ?? null,
    expectedMoves: nextPos?.bookMoves ? Object.keys(nextPos.bookMoves) : [],
  }

  return json(resp)
}
