import type { ParseTree } from '@mliebelt/pgn-parser';
import type { ActionFunction } from '@remix-run/node';
import type { Move } from 'chess.js';

import { parse } from '@mliebelt/pgn-parser';
import { json } from '@remix-run/node';
import { Chess } from 'chess.js';

import { authenticate } from '~/services/auth.server';
import { ChessBookService } from '~/services/chess-book.server';
import { stripFEN } from '~/services/utils';

export const action: ActionFunction = async ({ request }) => {
  const { userId } = await authenticate(request);

  const { orientation, pgn } = await request.json();
  const myColor = orientation === 'white' ? 'w' : 'b';
  if (!orientation) {
    return json({ error: 'Missing orientation' }, { status: 400 });
  }

  if (!pgn) {
    return json({ error: 'Missing pgn' }, { status: 400 });
  }

  try {
    const { moves, comments } = PGNWalk(pgn);
    const promises: Array<Promise<void>> = [];
    for (const move of moves) {
      promises.push(
        ChessBookService.addMove({
          userId,
          fen: move.before,
          isOpponentMove: move.color !== myColor,
          move: move.lan,
        }),
      );
    }
    for (const [fen, comment] of comments) {
      promises.push(
        ChessBookService.addComment({
          fen,
          userId,
          comment,
          orientation,
        }),
      );
    }
    await Promise.all(promises);
    return json({ success: true });
  } catch (e) {
    console.error('Error while loading pgn', e);
    return json({ error: 'Invalid pgn' }, { status: 400 });
  }
};

function PGNWalk(pgn: string) {
  const moves: Array<Move> = [];
  const comments: Map<string, string> = new Map();

  const games = parse(pgn, { startRule: 'games' }) as ParseTree[];

  for (const game of games) {
    const tree = game.moves;

    const queue: Array<{
      startingFEN: string;
      tree: ParseTree['moves'];
    }> = [
      {
        startingFEN: new Chess().fen(),
        tree,
      },
    ];

    while (queue.length) {
      const data = queue.pop();
      if (!data) continue;
      const { startingFEN, tree } = data;
      const g = new Chess(startingFEN);
      for (const node of tree) {
        queue.push(
          ...node.variations.flatMap((v) => ({
            startingFEN: g.fen(),
            tree: v,
          })),
        );
        const m = g.move(node.notation.notation);
        if (node.commentAfter) {
          comments.set(stripFEN(m.after), node.commentAfter);
        }
        moves.push(m);
      }
    }
  }

  return { moves, comments };
}
