import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { z } from "zod";
import { ChessBookService } from "~/services/chess-book.server";
import { isAuthorized } from "~/services/utils.server";

export const SaveMoveInputSchema = z.object({
  fen: z.string(),
  isOpponentMove: z.boolean(),
  move: z.string(),
});
export type SaveMoveInput = z.infer<typeof SaveMoveInputSchema>;

export const action: ActionFunction = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const input = SaveMoveInputSchema.parse(await request.json());
  await ChessBookService.addMove(input);

  return json({ success: true });
};
