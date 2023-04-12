import type { ActionFunction } from "@remix-run/node";

import { json } from "@remix-run/node";

import { ChessBookService } from "~/services/chess-book.server";

export const action: ActionFunction = async ({ request }) => {
  await ChessBookService.linkGraph();
  return json({ success: true });
};
