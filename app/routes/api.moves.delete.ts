import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const [userId, payload] = await Promise.all([
    authenticate(request).then((r) => r.userId),
    request.json(),
  ]);

  const { fen, move, isOpponentMove } = payload;

  await ChessBookService.deleteMove({ userId, fen, move, isOpponentMove });

  return json({ success: true });
};
