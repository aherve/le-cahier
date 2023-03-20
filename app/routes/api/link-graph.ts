import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ChessBookService } from "~/services/chess-book";

export const action: ActionFunction = async () => {
  await ChessBookService.linkGraph();
  return json({ success: true });
};
