import type { ActionFunction } from '@remix-run/node';

import { z } from 'zod';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';

const ExportPGNSchema = z.object({
  fen: z.string(),
  orientation: z.enum(['white', 'black']),
  moves: z.array(z.string()).default([]),
});

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);
  const input = ExportPGNSchema.parse(await request.json());
  const pgn = await ChessBookService.exportPGN(
    input.fen,
    input.orientation,
    userId,
    input.moves,
  );

  return new Response(pgn, {
    headers: {
      'Content-Type': 'application/x-chess-pgn',
      'Content-Disposition': 'attachment; filename="repertoire.pgn"',
    },
  });
};
