import { RepeatIcon } from "@chakra-ui/icons";
import { Button, Flex, Spacer } from "@chakra-ui/react";
import type { Square } from "chess.js";
import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import LichessLink from "./lichess-link";
import type { MoveType } from "./moves";
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

  function moveIndex(fen: string) {
    return Number(fen.split(" ")[5]);
  }

  return (
    <>
      <Flex grow="1" direction="row" align="top" gap="20">
        <Flex
          direction="column"
          align="center"
          justify="space-between"
          gap="10"
          grow="1"
        >
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={orientation}
          />
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
        <Moves moves={moves}></Moves>
      </Flex>
    </>
  );
}