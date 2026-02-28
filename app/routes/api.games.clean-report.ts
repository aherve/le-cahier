import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);
  const { gameId } = await request.json();
  if (!gameId) {
    return json({ error: 'Missing gameId' }, { status: 400 });
  }

  await ChessBookService.cleanGameReport(gameId, userId);
  return json({ success: true });
};
