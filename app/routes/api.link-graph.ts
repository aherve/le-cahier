import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate, isAdmin } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId, username } = await authenticate(request);
  //const admin = await isAdmin(username);
  //if (!admin) {
  //  return json({ error: 'Unauthorized' }, { status: 401 });
  //}
  const res = await ChessBookService.linkGraph(userId);
  return json(res);
};
