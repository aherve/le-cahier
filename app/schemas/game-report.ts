import { z } from 'zod'
import { MoveSchema } from './lichess'

export const ReportStatusSchema = z.enum([
  'notFound',
  'success',
  'failed',
  'opponentMove',
])

export const MissSchema = z.object({
  status: z.literal(ReportStatusSchema.enum.failed),
  played: z.string(),
  expected: z.string().array(),
})

export const GameReportSchema = z.object({
  gameId: z.string(),
  movesReport: z
    .discriminatedUnion('status', [
      //
      MissSchema,
      z.object({
        status: z.literal(ReportStatusSchema.enum.notFound),
      }),
      z.object({
        status: z.literal(ReportStatusSchema.enum.success),
      }),
      z.object({
        status: z.literal(ReportStatusSchema.enum.opponentMove),
      }),
    ])
    .array(),
  firstError: MoveSchema.optional(),
  firstOutOfBook: MoveSchema.optional(),
})

export type GameReport = z.infer<typeof GameReportSchema>
