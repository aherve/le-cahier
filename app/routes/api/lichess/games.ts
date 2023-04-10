import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { LichessGameParserSchema, LICHESS_USERNAME } from "~/schemas/lichess";

import cache from "memory-cache";
import { ChessBookService } from "~/services/chess-book.server";
import { isAuthorized } from "~/services/utils.server";

const LICHESS_TOKEN = process.env.LICHESS_TOKEN;
const GAMES_COUNT = 20;

export const loader: LoaderFunction = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const cached = cache.get("gameList");
  if (cached) {
    console.log("server is serving from cache");
    return json(cached);
  }

  const headers = {
    Authorization: `Bearer ${LICHESS_TOKEN}`,
    Accept: "application/x-ndjson",
  };

  const url =
    `https://lichess.org/api/games/user/${LICHESS_USERNAME}?` +
    new URLSearchParams({
      max: GAMES_COUNT.toString(),
      opening: "true",
      ongoing: "false",
    });

  console.log("SERVER IS FETCHING !");
  const apiRes = await fetch(url, { headers });
  const data = (await apiRes.text()).split("\n").filter(Boolean);
  const rawJSON = data.map((d) => JSON.parse(d));
  try {
    const parsed = LichessGameParserSchema.array().parse(rawJSON);

    cache.put("gameList", parsed, 60_000);

    await Promise.all(
      parsed.map((g) => {
        return ChessBookService.setGame(g);
      })
    );

    return json(parsed);
  } catch (e) {
    console.error("ERROR", e);
    return json([], { status: 500 });
  }
};
