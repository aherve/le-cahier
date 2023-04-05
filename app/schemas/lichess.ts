import type { Move } from 'chess.js'
import { Chess } from 'chess.js'
import { z } from 'zod'

const LichessGameUserSchema = z.object({
  rating: z.number(),
  ratingDiff: z.number(),
  user: z.object({
    name: z.string(),
    patron: z.boolean().optional(),
    id: z.string(),
  }),
})

export const LichessGameSchema = z
  .object({
    id: z.string(),
    rated: z.boolean(),
    variant: z.string(),
    speed: z.string(),
    perf: z.string(),
    createdAt: z.number(),
    lastMoveAt: z.number(),
    status: z.string(),
    players: z.object({
      white: LichessGameUserSchema,
      black: LichessGameUserSchema,
    }),
    winner: z.string(),
    opening: z.object({
      eco: z.string(),
      name: z.string(),
      ply: z.number(),
    }),
    moves: z.string(),
    clock: z.object({
      initial: z.number(),
      increment: z.number(),
      totalTime: z.number(),
    }),
  })
  .transform((game) => {
    const g = new Chess()
    const newMoves: Move[] = []
    for (const move of game.moves.split(' ')) {
      const m = g.move(move)
      newMoves.push(m)
    }

    return {
      ...game,
      moves: newMoves as Move[],
    }
  })
export type LichessGame = z.infer<typeof LichessGameSchema>
