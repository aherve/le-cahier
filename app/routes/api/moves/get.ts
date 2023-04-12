import type { LoaderFunction } from "@remix-run/node";

import { json } from "@remix-run/node";

import { ChessBookService } from "~/services/chess-book.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const fen = url.searchParams.get("fen");
  if (!fen) {
    throw new Error("Missing fen");
  }

  const move = await ChessBookService.getPosition(fen);
  return json(move);
};
