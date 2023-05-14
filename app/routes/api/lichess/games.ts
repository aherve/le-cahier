import type { LoaderFunction } from '@remix-run/node';

import { redirect, json } from '@remix-run/node';

import { LichessGameParserSchema } from '~/schemas/lichess';
import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';
import { getSession } from '~/session';

const GAMES_COUNT = 5;

export const loader: LoaderFunction = async ({ request }) => {
  const { userId } = await authenticate(request);

  const until =
    new URL(request.url).searchParams.get('until') ?? Date.now().toString();

  const session = await getSession(request.headers.get('Cookie'));
  const lichessToken = session.get('lichessAccessToken');
  const lichessUsername = session.get('lichessUsername');
  if (!lichessToken || !lichessUsername) {
    return redirect('/lichess/login');
  }

  const headers = {
    Authorization: `Bearer ${lichessToken}`,
    Accept: 'application/x-ndjson',
  };

  const url =
    `https://lichess.org/api/games/user/${lichessUsername}?` +
    new URLSearchParams({
      max: GAMES_COUNT.toString(),
      ongoing: 'false',
      opening: 'true',
      until,
    });

  const apiRes = await fetch(url, { headers });
  const data = (await apiRes.text()).split('\n').filter(Boolean);
  const rawJSON = data.map((d) => JSON.parse(d));
  try {
    const parsed = LichessGameParserSchema.array().parse(rawJSON);

    await Promise.all(
      parsed.map((g) => {
        return ChessBookService.setGame(g, userId);
      }),
    );

    return json(parsed);
  } catch (e) {
    console.error('ERROR', e);
    return json([], { status: 500 });
  }
};
