import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);

  const form = await request.formData();
  const pgn = form.get('pgn') as string;
  console.log('DEBUG', pgn);
  return json({ pgn, userId });
};
