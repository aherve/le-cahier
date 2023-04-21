import type { ActionFunction} from '@remix-run/node';

import { json } from '@remix-run/node';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);
  const { fen, isSuccess } = await request.json();

  if (!fen) {
    return {
      status: 400,
      json: {
        message: 'Missing fen',
      },
    };
  }

  if (isSuccess == null) {
    return {
      status: 400,
      json: {
        message: 'Missing isSuccess',
      },
    };
  }

  await ChessBookService.updateAnki({ userId, fen, isSuccess });
  return json({ success: true });
};
