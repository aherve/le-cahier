import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { Flex } from "@chakra-ui/react";
import { SaveMoveInputSchema } from "~/routes/api/moves/create";

export function Record(props: { orientation: BoardOrientation }) {
  const [fen, setFen] = useState(new Chess().fen());

  const game = new Chess(fen);

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = game.move(move);

      const wasOpponentMove =
        (validMove.color === "b" && props.orientation === "white") ||
        (validMove.color === "w" && props.orientation === "black");

      await fetch("api/moves/create", {
        method: "POST",
        body: JSON.stringify(
          SaveMoveInputSchema.parse({
            isOpponentMove: wasOpponentMove,
            fen,
            move: `${validMove.from}${validMove.to}`,
          })
        ),
      });
      setFen(game.fen());

      return validMove;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return makeMove({ from: sourceSquare, to: targetSquare }) !== null;
  }

  return (
    <>
      <Flex direction="column" align="center" gap="10">
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardWidth={400}
          boardOrientation={props.orientation}
        />
      </Flex>
    </>
  );
}
