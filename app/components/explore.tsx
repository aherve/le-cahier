import { RepeatIcon } from "@chakra-ui/icons";
import { Button, Code, Flex, Spacer } from "@chakra-ui/react";
import type { Square } from "chess.js";
import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import LichessLink from "./lichess-link";
import type { MoveType } from "./moves";
import { addMove } from "./moves";
import Moves from "./moves";

export default function Explore(props: {
  initialFen?: string;
  orientation?: BoardOrientation;
  startTraining: (fen: string, orientation: BoardOrientation) => void;
}) {
  const [fen, setFen] = useState(props.initialFen ?? new Chess().fen());
  const [orientation, setOrientation] = useState<BoardOrientation>(
    props.orientation ?? "white"
  );

  const [moves, setMoves] = useState<Array<MoveType>>([]);

  function flip() {
    setOrientation((o) => (o === "white" ? "black" : "white"));
  }

  function onDrop(from: Square, to: Square) {
    try {
      const g = new Chess(fen);
      const m = g.move({ from, to });
      setMoves(addMove(m, moves));
      setFen(g.fen());
      return true;
    } catch {
      return false;
    }
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <Flex
          direction="column"
          align="center"
          justify="space-between"
          gap="10"
          grow="1"
        >
          <Flex direction="row" gap="20">
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardWidth={400}
              boardOrientation={orientation}
            />
            <Moves moves={moves}></Moves>
          </Flex>
          <Flex direction="row" gap="5" align="center">
            <Button leftIcon={<RepeatIcon />} onClick={flip}>
              flip board
            </Button>
            <Button onClick={() => props.startTraining(fen, orientation)}>
              Train from this position
            </Button>
            <LichessLink fen={fen}></LichessLink>
          </Flex>
        </Flex>
        <Spacer />
        <Code>{fen}</Code>
      </Flex>
    </>
  );
}
