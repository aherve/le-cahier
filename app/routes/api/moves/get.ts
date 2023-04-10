import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ChessBookService } from "~/services/chess-book.server";
import { isAuthorized } from "~/services/utils.server";

export const loader: LoaderFunction = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const fen = url.searchParams.get("fen");
  if (!fen) {
    throw new Error("Missing fen");
  }

  const move = await ChessBookService.getPosition(fen);
  return json(move);
};
