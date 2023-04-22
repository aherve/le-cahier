import type { ActionFunction } from '@remix-run/node';

import { json } from '@remix-run/node';
import { z } from 'zod';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

export const SaveMoveInputSchema = z.object({
  fen: z.string(),
  isOpponentMove: z.boolean(),
  move: z.string(),
  comment: z.string().optional(),
});
export type SaveMoveInput = z.infer<typeof SaveMoveInputSchema>;

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);
  const input = SaveMoveInputSchema.parse(await request.json());
  await ChessBookService.addMove({ ...input, userId });

  return json({ success: true });
};
