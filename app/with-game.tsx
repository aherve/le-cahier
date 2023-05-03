import type { Move } from 'chess.js';
import type { ReactNode } from 'react';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { Chess } from 'chess.js';
import { useEffect, useCallback, createContext, useState } from 'react';

import { useKeyPress } from './hooks/key-press';

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
  const [game, setGame] = useState<Chess>(new Chess());
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [backWasPressed, setBackWasPressed] = useState(false);
  const [forwardWasPressed, setForwardWasPressed] = useState(false);
  const [forwardMoveStack, setForwardMoveStack] = useState<Move[]>([]);

  const fen = game.fen();
  const moves: Move[] = game.history({ verbose: true });
  const turn = game.turn();

  const arrowLeftPressed = useKeyPress('ArrowLeft');
  const arrowRightPressed = useKeyPress('ArrowRight');
  const makeMove = useCallback(
    (move: string | { from: string; to: string; promotion?: string }) => {
      const m = game.move(move);
      if (m.lan === forwardMoveStack[0]?.lan) {
        setForwardMoveStack((prev) => prev.slice(1));
      } else {
        setForwardMoveStack([]);
      }
      return m;
    },
    [game, forwardMoveStack, setForwardMoveStack],
  );

  const undo = useCallback(() => {
    const undone = game.undo();
    if (undone) {
      setForwardMoveStack((moves) => [undone, ...moves]);
    }
  }, [game, setForwardMoveStack]);

  useEffect(() => {
    if (arrowRightPressed) {
      setForwardWasPressed(true);
    }
    if (!arrowRightPressed && forwardWasPressed) {
      setForwardWasPressed(false);
      const move = forwardMoveStack[0];
      if (move) {
        makeMove(move);
      }
    }
  }, [arrowRightPressed, game, forwardWasPressed, forwardMoveStack, makeMove]);

  useEffect(() => {
    if (arrowLeftPressed) {
      setBackWasPressed(true);
    }
    if (!arrowLeftPressed && backWasPressed) {
      setBackWasPressed(false);
      undo();
    }
  }, [arrowLeftPressed, backWasPressed, undo]);

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
        undo();
      }
    },
    [game, undo],
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
