import { useState } from "react";
import type { Move } from "chess.js";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";

export function Train(props: { orientation: BoardOrientation }) {
  const [fen, setFen] = useState(new Chess().fen());

  const game = new Chess(fen);
  if (
    (props.orientation === "black" && game.turn() === "w") ||
    (props.orientation === "white" && game.turn() === "b")
  ) {
    setTimeout(makeRandomMove, 500);
  }

  function makeMove(move: string | { from: Square; to: Square }): Move | null {
    try {
      const validMove = game.move(move);
      setFen(game.fen());
      return validMove;
    } catch {
      return null;
    }
  }

  function makeRandomMove() {
    const possibleMoves = game.moves();

    // exit if the game is over
    if (possibleMoves.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    makeMove(possibleMoves[randomIndex]);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return makeMove({ from: sourceSquare, to: targetSquare }) !== null;
  }

  return (
    <>
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardWidth={400}
        boardOrientation={props.orientation}
      />
    </>
  );
}
