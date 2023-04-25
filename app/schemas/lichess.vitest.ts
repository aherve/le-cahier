import { it, describe, expect } from 'vitest';

import { LichessGameParserSchema } from './lichess';

describe('lichess schema', () => {
  it('can parse a game', () => {
    const sample = require('./game-sample.json');

    expect(LichessGameParserSchema.safeParse(sample).success).toBe(true);
    expect(LichessGameParserSchema.parse(sample)).toEqual({
      id: 'P3DJiMVw',
      rated: true,
      variant: 'standard',
      speed: 'blitz',
      perf: 'blitz',
      createdAt: 1680624715481,
      lastMoveAt: 1680625699051,
      status: 'mate',
      players: {
        white: {
          rating: 1705,
          ratingDiff: 6,
          user: {
            name: 'MaximeCaVaChierGrave',
            patron: true,
            id: 'maximecavachiergrave',
          },
        },
        black: {
          rating: 1702,
          ratingDiff: -6,
          user: {
            name: 'Hichemyouss',
            id: 'hichemyouss',
          },
        },
      },
      winner: 'white',
      opening: {
        eco: 'C00',
        name: 'Rat Defense: Small Center Defense',
        ply: 4,
      },
      moves: [
        {
          color: 'w',
          piece: 'p',
          from: 'e2',
          to: 'e4',
          san: 'e4',
          flags: 'b',
          lan: 'e2e4',
          before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        },
        {
          color: 'b',
          piece: 'p',
          from: 'e7',
          to: 'e6',
          san: 'e6',
          flags: 'n',
          lan: 'e7e6',
          before: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
          after: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        },
        {
          color: 'w',
          piece: 'p',
          from: 'd2',
          to: 'd4',
          san: 'd4',
          flags: 'b',
          lan: 'd2d4',
          before:
            'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
          after: 'rnbqkbnr/pppp1ppp/4p3/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2',
        },
        {
          color: 'b',
          piece: 'p',
          from: 'd7',
          to: 'd6',
          san: 'd6',
          flags: 'n',
          lan: 'd7d6',
          before:
            'rnbqkbnr/pppp1ppp/4p3/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2',
          after: 'rnbqkbnr/ppp2ppp/3pp3/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
        },
      ],
      clock: { initial: 300, increment: 3, totalTime: 420 },
    });
  });
});
