import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { Button, Flex } from "@chakra-ui/react";

export function Record(props: { orientation: BoardOrientation }) {
  const [fen, setFen] = useState(new Chess().fen());

  const game = new Chess(fen);

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = game.move(move);
      setFen(game.fen());
      return validMove;
    } catch {
      return null;
    }
  }

  async function save() {
    //await props.book.save();
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
        <Button onClick={save}>save</Button>
      </Flex>
    </>
  );
}
