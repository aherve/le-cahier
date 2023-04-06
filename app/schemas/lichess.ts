import type { Move } from 'chess.js'
import { Chess } from 'chess.js'
import { z } from 'zod'

export const LICHESS_USERNAME = 'MaximeCaVaChierGrave'

const SquareSchema = z.enum([
  'a8',
  'b8',
  'c8',
  'd8',
  'e8',
  'f8',
  'g8',
  'h8',
  'a7',
  'b7',
  'c7',
  'd7',
  'e7',
  'f7',
  'g7',
  'h7',
  'a6',
  'b6',
  'c6',
  'd6',
  'e6',
  'f6',
  'g6',
  'h6',
  'a5',
  'b5',
  'c5',
  'd5',
  'e5',
  'f5',
  'g5',
  'h5',
  'a4',
  'b4',
  'c4',
  'd4',
  'e4',
  'f4',
  'g4',
  'h4',
  'a3',
  'b3',
  'c3',
  'd3',
  'e3',
  'f3',
  'g3',
  'h3',
  'a2',
  'b2',
  'c2',
  'd2',
  'e2',
  'f2',
  'g2',
  'h2',
  'a1',
  'b1',
  'c1',
  'd1',
  'e1',
  'f1',
  'g1',
  'h1',
])
const PieceSymbolSchema = z.enum(['p', 'n', 'b', 'r', 'q', 'k'])
export const MoveSchema = z.object({
  color: z.enum(['w', 'b']),
  from: SquareSchema,
  to: SquareSchema,
  piece: PieceSymbolSchema,
  captured: PieceSymbolSchema.optional(),
  promotion: PieceSymbolSchema.optional(),
  flags: z.string(),
  san: z.string(),
  lan: z.string(),
  before: z.string(),
  after: z.string(),
})
const LichessGameUserSchema = z.object({
  rating: z.number(),
  ratingDiff: z.number(),
  user: z.object({
    name: z.string(),
    patron: z.boolean().optional(),
    id: z.string(),
  }),
})

const LichessGameCommonSchema = z.object({
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
  winner: z.string().optional(),
  opening: z.object({
    eco: z.string(),
    name: z.string(),
    ply: z.number(),
  }),
  clock: z.object({
    initial: z.number(),
    increment: z.number(),
    totalTime: z.number(),
  }),
})

export const LichessGameParserSchema = LichessGameCommonSchema.extend({
  moves: z.string(),
}).transform((game) => {
  const g = new Chess()
  const newMoves: Move[] = []
  for (const move of game.moves.split(' ')) {
    const m = g.move(move)
    newMoves.push(m)
  }

  return {
    ...game,
    moves: MoveSchema.array().parse(newMoves),
  }
})

export const LichessGameSchema = LichessGameCommonSchema.extend({
  moves: MoveSchema.array(),
})

export type LichessGame = z.infer<typeof LichessGameSchema>
