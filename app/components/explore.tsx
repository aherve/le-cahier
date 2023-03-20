import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import type { Square } from "chess.js";
import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import type { MoveType } from "./moves";
import Moves from "./moves";

export default function Explore(props: {
  initialFen?: string;
  orientation?: BoardOrientation;
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
      if (m.color === "w") {
        setMoves((moves) => [
          ...moves,
          {
            moveIndex: moveIndex(fen),
            whiteMove: m.san,
          },
        ]);
      } else {
        setMoves((moves) => {
          moves[moves.length - 1].blackMove = m.san;
          return moves;
        });
      }
      setFen(g.fen());
      return true;
    } catch {
      return false;
    }
  }

  return (
    <>
      <Flex direction="column" align="center" gap="10">
        <Flex grow="1" direction="row" align="top" gap="20">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={orientation}
          />
          <Spacer />
          <Card minWidth="200px" flexGrow="1">
            <CardBody>
              <Moves moves={moves}></Moves>
            </CardBody>
          </Card>
        </Flex>
        <Box>
          <Button onClick={flip}>flip board</Button>
        </Box>
      </Flex>
    </>
  );
}

function moveIndex(fen: string) {
  return Number(fen.split(" ")[5]);
}
