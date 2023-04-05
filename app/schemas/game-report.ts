import { z } from "zod";

export const GameReportSchema = z.object({
  gameId: z.string(),
});

export type GameReport = z.infer<typeof GameReportSchema>;
