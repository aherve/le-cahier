import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { Button, Flex } from "@chakra-ui/react";
import { SaveMoveInputSchema } from "~/routes/api/moves/create";

export function Record(props: { initialFen?: string }) {
  const [fen, setFen] = useState(props.initialFen ?? new Chess().fen());
  const [orientation, setOrientation] = useState<BoardOrientation>("white");

  const game = new Chess(fen);

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = game.move(move);

      const wasOpponentMove =
        (validMove.color === "b" && orientation === "white") ||
        (validMove.color === "w" && orientation === "black");

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

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  return (
    <>
      <Flex direction="column" align="center" gap="10">
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardWidth={400}
          boardOrientation={orientation}
        />
        <Button onClick={flip}>flip board</Button>
      </Flex>
    </>
  );
}
