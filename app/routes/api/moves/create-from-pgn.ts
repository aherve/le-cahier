import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';
import { Chess } from 'chess.js';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);

  const { orientation, pgn } = await request.json();
  const myColor = orientation === 'white' ? 'w' : 'b';
  if (!orientation) {
    return json({ error: 'Missing orientation' }, { status: 400 });
  }

  if (!pgn) {
    return json({ error: 'Missing pgn' }, { status: 400 });
  }

  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const allComments = game.getComments().reduce((acc, moveComment) => {
      const { fen, comment } = moveComment;
      if (comment && comment.length > 0) {
        acc.set(fen, comment);
      }
      return acc;
    }, new Map<string, string>());

    const toRecord = game.history({ verbose: true });

    const promises: Array<Promise<void>> = [];
    for (const move of toRecord) {
      promises.push(
        ChessBookService.addMove({
          userId,
          fen: move.before,
          isOpponentMove: move.color !== myColor,
          move: move.lan,
          comment: allComments.get(move.before),
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
