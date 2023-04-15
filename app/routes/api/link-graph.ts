import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);
  const res = await ChessBookService.linkGraph(userId);
  return json(res);
};
