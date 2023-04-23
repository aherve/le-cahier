import type { Move } from 'chess.js';
import type { ReactNode } from 'react';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { useForceUpdate } from '@chakra-ui/react';
import { Chess } from 'chess.js';
import { useCallback, createContext, useState } from 'react';

export const GameContext = createContext({
  backTo: (_: string) => {},
  fen: new Chess().fen(),
  isValidMove: (_: string | { from: string; to: string }) => false as boolean,
  makeMove: (_: string | { from: string; to: string; promotion?: string }) => {
    return new Chess().move('e4');
  },
  moves: [] as Move[],
  reset: (_?: string) => {},
  turn: 'w',
  orientation: 'white' as BoardOrientation,
  setOrientation: (_: BoardOrientation) => {},
});

export function WithGame(props: { children: ReactNode }) {
  const forceUpdate = useForceUpdate();
  const [game, setGame] = useState<Chess>(new Chess());
  const [orientation, setOrientation] = useState<BoardOrientation>('white');

  const fen = game.fen();
  const moves: Move[] = game.history({ verbose: true });
  const turn = game.turn();

  const makeMove = useCallback(
    (move: string | { from: string; to: string; promotion?: string }) => {
      const m = game.move(move);
      forceUpdate();
      return m;
    },
    [game, forceUpdate],
  );

  const isValidMove = useCallback(
    (move: string | { from: string; to: string }) => {
      try {
        const gg = new Chess(fen);
        gg.move(move);
        return true;
      } catch {
        return false;
      }
    },
    [fen],
  );

  const reset = useCallback((fen?: string) => {
    setGame(new Chess(fen));
  }, []);

  const backTo = useCallback(
    (fen: string) => {
      while (game.fen() !== fen) {
        game.undo();
      }
      forceUpdate();
    },
    [game, forceUpdate],
  );

  return (
    <>
      <GameContext.Provider
        value={{
          backTo,
          fen,
          isValidMove,
          makeMove,
          moves,
          orientation,
          reset,
          setOrientation,
          turn,
        }}
      >
        {props.children}
      </GameContext.Provider>
    </>
  );
}
