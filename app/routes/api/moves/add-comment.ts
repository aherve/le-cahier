import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const [userId, payload] = await Promise.all([
    //
    authenticate(request).then((u) => u.userId),
    request.json(),
  ]);

  const { comment, fen, orientation } = payload;
  if (!fen) {
    return json({ error: 'Missing fen' }, { status: 400 });
  }
  if (!orientation) {
    return json({ error: 'Missing orientation' }, { status: 400 });
  }

  await ChessBookService.addComment({
    userId,
    comment: comment ?? '',
    fen,
    orientation,
  });

  return json({ success: true });
};
