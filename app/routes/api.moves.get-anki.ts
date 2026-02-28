import type { LoaderFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const loader: LoaderFunction = async ({ request }) => {
  const { userId } = await authenticate(request);

  // get skipNovelties from url query parameters
  const skipNovelties =
    new URL(request.url).searchParams.get('skipNovelties') === 'true';

  const data = await ChessBookService.getAnki(userId, skipNovelties);
  return data ?? json({ error: 'empty' });
};
