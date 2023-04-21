import { Chess } from 'chess.js';
import { it, expect, describe } from 'vitest';

import { stripFEN } from './utils';

describe('stripFEN', () => {
  it('can remove move order from a FEN', () => {
    const input =
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

    const output = stripFEN(input);
    const expected = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -';

    expect(output).toEqual(expected);
  });

  it("doesn't strip twice", () => {
    const fen = new Chess().fen();

    expect(stripFEN(fen)).toEqual(stripFEN(stripFEN(fen)));
  });

  it('produces a chess.js valid fen nonetheless', () => {
    // create a legit game
    const g = new Chess();
    g.move('e4');
    g.move('e5');

    // remove move count
    const strippedFEN = stripFEN(g.fen());

    // Create new game from it
    const reconstructedGame = new Chess(strippedFEN);
    // strip fen and check we are in the same state
    const healed = stripFEN(reconstructedGame.fen());

    expect(healed).toEqual(strippedFEN);
  });
});
