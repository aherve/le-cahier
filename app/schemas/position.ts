import { z } from 'zod'

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