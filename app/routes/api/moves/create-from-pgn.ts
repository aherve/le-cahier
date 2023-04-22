import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';
import { Chess } from 'chess.js';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);

  const { orientation, pgn } = await request.json();
  const color = orientation === 'white' ? 'w' : 'b';
  if (!orientation) {
    return json({ error: 'Missing orientation' }, { status: 400 });
  }

  if (!pgn) {
    return json({ error: 'Missing pgn' }, { status: 400 });
  }

  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const toRecord = game
      .history({ verbose: true })
      .filter((m) => m.color === color);

    const promises = [];
    for (const move of toRecord) {
      promises.push(
        ChessBookService.addMove({
          userId,
          fen: move.before,
          isOpponentMove: false,
          move: move.lan,
        }),
      );
    }

    await Promise.all(promises);

    return json({ success: true });
  } catch (e) {
    console.error('Error while loading pgn', e);
    return json({ error: 'Invalid pgn' }, { status: 400 });
  }
};
