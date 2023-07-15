import { z } from 'zod';

export const AdminReportSchema = z.object({
  usage: z.record(
    z.string().uuid(),
    z.object({
      bookMoves: z.number(),
      opponentMoves: z.number(),
      positions: z.number(),
      comments: z.number(),
    }),
  ),
  totalUsers: z.number(),
});
export type AdminReport = z.infer<typeof AdminReportSchema>;
