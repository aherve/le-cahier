import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { GetChallengeOutputSchema } from "~/routes/api/moves/challenge";

export function Train(props: { orientation: BoardOrientation }) {
  const [fen, setFen] = useState(new Chess().fen());

  const turn = new Chess(fen).turn();

  useEffect(() => {
    async function makeOpponentMove() {
      const response = await fetch(
        `api/moves/challenge?fen=${encodeURIComponent(fen)}`
      );
      const challenge = GetChallengeOutputSchema.parse(await response.json());
      if (challenge.challengeMove) {
        const g = new Chess(fen);
        g.move(challenge.challengeMove);
        setFen(g.fen());
      }
    }

    if (
      (props.orientation === "black" && turn === "w") ||
      (props.orientation === "white" && turn === "b")
    ) {
      makeOpponentMove();
    }
  }, [fen, props.orientation, turn, setFen]);

  function makeMove(move: string | { from: Square; to: Square }): boolean {
    try {
      const g = new Chess(fen);
      g.move(move);
      setFen(g.fen());
      return true;
    } catch {
      return false;
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    console.log("dropped");
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
