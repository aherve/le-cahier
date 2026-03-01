import type { Move } from 'chess.js';
import type { ReactNode } from 'react';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { Chess } from 'chess.js';
import { useEffect, useCallback, createContext, useState } from 'react';

import { useKeyPress } from './hooks/key-press';

const NO_SOUND = 'noSound';

export const GameContext = createContext({
  backTo: () => {},
  fen: new Chess().fen(),
  isValidMove: () => false as boolean,
  makeMove: () => {
    return new Chess().move('e4');
  },
  moves: [] as Move[],
  reset: () => {},
  turn: 'w',
  orientation: 'white' as BoardOrientation,
  setOrientation: () => {},
  soundEnabled: true,
  toggleSound: () => {},
});

export function WithGame(props: { children: ReactNode }) {
  const [game, setGame] = useState<Chess>(new Chess());
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [backWasPressed, setBackWasPressed] = useState(false);
  const [forwardWasPressed, setForwardWasPressed] = useState(false);
  const [forwardMoveStack, setForwardMoveStack] = useState<Move[]>([]);
  const [noSound, setNoSound] = useState(
    localStorage.getItem(NO_SOUND) === 'true',
  );

  useEffect(() => {
    localStorage.setItem(NO_SOUND, noSound.toString());
  }, [noSound]);

  const fen = game.fen();
  const moves: Move[] = game.history({ verbose: true });
  const turn = game.turn();

  const toggleSound = useCallback(() => {
    setNoSound((v) => !v);
  }, [setNoSound]);

  const arrowLeftPressed = useKeyPress('ArrowLeft');
  const arrowRightPressed = useKeyPress('ArrowRight');
  const makeMove = useCallback(
    (move: string | { from: string; to: string; promotion?: string }) => {
      const moveSound = new Audio('sounds/Move.ogg');
      const captureSound = new Audio('sounds/Capture.ogg');

      // Create new game and replay all history to maintain move list
      const history = game.history({ verbose: true });
      const newGame = new Chess();
      for (const m of history) {
        newGame.move({ from: m.from, to: m.to, promotion: m.promotion });
      }

      const m = newGame.move(move);
      if (!noSound) {
        void (m.captured ? captureSound.play() : moveSound.play());
      }
      if (m.lan === forwardMoveStack[0]?.lan) {
        setForwardMoveStack((prev) => prev.slice(1));
      } else {
        setForwardMoveStack([]);
      }
      setGame(newGame);
      return m;
    },
    [game, forwardMoveStack, setForwardMoveStack, noSound],
  );

  const undo = useCallback(() => {
    const history = game.history({ verbose: true });
    if (history.length === 0) return;

    const newGame = new Chess();
    // Replay all moves except the last one
    for (let i = 0; i < history.length - 1; i++) {
      newGame.move({
        from: history[i].from,
        to: history[i].to,
        promotion: history[i].promotion,
      });
    }

    const undone = history[history.length - 1];
    setForwardMoveStack((moves) => [undone, ...moves]);
    setGame(newGame);
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
    (targetFen: string) => {
      const history = game.history({ verbose: true });
      const newGame = new Chess();
      for (const m of history) {
        if (newGame.fen() === targetFen) break;
        newGame.move({ from: m.from, to: m.to, promotion: m.promotion });
      }
      setForwardMoveStack([]);
      setGame(newGame);
    },
    [game],
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
          toggleSound,
          soundEnabled: !noSound,
        }}
      >
        {props.children}
      </GameContext.Provider>
    </>
  );
}
