import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { Button, Flex } from "@chakra-ui/react";
import { SaveMoveInputSchema } from "~/routes/api/moves/create";
import type { MoveType } from "./moves";
import Moves, { addMove } from "./moves";

export function Record(props: { initialFen?: string }) {
  const [fen, setFen] = useState(props.initialFen ?? new Chess().fen());
  const [orientation, setOrientation] = useState<BoardOrientation>("white");
  const [moves, setMoves] = useState<Array<MoveType>>([]);

  const game = new Chess(fen);

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = game.move(move);

      const wasOpponentMove =
        (validMove.color === "b" && orientation === "white") ||
        (validMove.color === "w" && orientation === "black");

      setMoves(addMove(validMove, moves, fen));
      setFen(game.fen());
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

      return validMove;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function goTo(fen: string, moves: MoveType[]) {
    setMoves(moves);
    setFen(fen);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return makeMove({ from: sourceSquare, to: targetSquare }) !== null;
  }

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  return (
    <>
      <Flex direction="row" gap="20">
        <Flex direction="column" align="center" gap="10">
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={orientation}
          />
          <Button onClick={flip}>flip board</Button>
        </Flex>
        <Moves moves={moves} goTo={goTo}></Moves>
      </Flex>
    </>
  );
}
