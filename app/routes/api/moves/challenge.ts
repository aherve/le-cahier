import type { LoaderFunction } from '@remix-run/node'

import { json } from '@remix-run/node'
import { z } from 'zod'

import { authenticate } from '~/services/auth.server'
import { ChessBookService } from '~/services/chess-book.server'

export const GetChallengeOutputSchema = z.object({
  challengeMove: z.string().nullable(),
  expectedMoves: z.string().array(),
})
export type GetChallengeOutput = z.infer<typeof GetChallengeOutputSchema>

export const loader: LoaderFunction = async ({ request }) => {
  const { userId } = await authenticate(request)
  const url = new URL(request.url)
  const fen = url.searchParams.get('fen')
  if (!fen) {
    throw new Error('Missing fen')
  }

  const res = await ChessBookService.getRandomOpponentMove(fen, userId)
  if (!res) {
    return json({ challengeMove: null, expectedMoves: [] })
  }
  const { move, targetFEN } = res

  const nextPos = await ChessBookService.getPosition(targetFEN, userId)

  const resp: GetChallengeOutput = {
    challengeMove: move,
    expectedMoves: nextPos?.bookMoves ? Object.keys(nextPos.bookMoves) : [],
  }

  return json(resp)
}
