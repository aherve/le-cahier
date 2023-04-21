import { z } from 'zod';

export const BookMoveSchema = z.object({
  targetFEN: z.string(),
});
export type BookMove = z.infer<typeof BookMoveSchema>;
export const BookPositionSchema = z.object({
  ankiScore: z.number().default(0),
  bookMoves: z.record(z.string(), BookMoveSchema).default({}),
  fen: z.string(),
  opponentMoves: z.record(z.string(), BookMoveSchema).default({}),
  userId: z.string().uuid(),
});
export type BookPosition = z.infer<typeof BookPositionSchema>;
