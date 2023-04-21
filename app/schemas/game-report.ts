import { z } from 'zod';

import { MoveSchema } from './lichess';

export const ReportStatusSchema = z.enum([
  'notFound',
  'success',
  'failed',
  'opponentMove',
]);

export const MissedMoveSchema = z.object({
  status: z.literal(ReportStatusSchema.enum.failed),
  played: z.string(),
  expected: z.string().array(),
});
export type MissedMove = z.infer<typeof MissedMoveSchema>;

export const GameReportSchema = z.object({
  gameId: z.string(),
  movesReport: z
    .discriminatedUnion('status', [
      //
      MissedMoveSchema,
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
  lichessUsername: z.string(),
});

export type GameReport = z.infer<typeof GameReportSchema>;
