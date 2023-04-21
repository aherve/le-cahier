import type { LoaderFunction } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const loader: LoaderFunction = async ({ request }) => {
  const { userId } = await authenticate(request);
  return ChessBookService.getAnki(userId);
};
