import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ChessBookService } from "~/services/chess-book.server";
import { isAuthorized } from "~/services/utils.server";

export const action: ActionFunction = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const { gameId } = await request.json();
  if (!gameId) {
    return json({ error: "Missing gameId" }, { status: 400 });
  }

  await ChessBookService.cleanGameReport(gameId);
  return json({ success: true });
};
