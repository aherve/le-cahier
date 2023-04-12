import type { Move } from "chess.js";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";

import { Button, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";

import Moves from "./moves";

import { SaveMoveInputSchema } from "~/routes/api/moves/create";
import { BookPositionSchema } from "~/schemas/position";
import { GameService } from "~/services/gameService";
import { toSAN } from "~/services/utils";

export function Record() {
  const [bookMoves, setBookMoves] = useState<string[]>([]);
  const [fen, setFen] = useState(GameService.fen);
  const [orientation, setOrientation] = useState<BoardOrientation>("white");

  const moves = GameService.moves;

  useEffect(() => {
    fetch(`/api/moves/get?fen=${encodeURIComponent(fen)}`)
      .then((res) => res.json())
      .then((data) => {
        const isPlayerTurn = GameService.turn === orientation[0];
        const position = BookPositionSchema.nullable().parse(data);
        setBookMoves(
          (isPlayerTurn
            ? Object.keys(position?.bookMoves ?? {})
            : Object.keys(position?.opponentMoves ?? {})
          ).map((m) => toSAN(fen, m))
        );
      });
  }, [fen, orientation]);

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = GameService.makeMove(move);

      const wasOpponentMove =
        (validMove.color === "b" && orientation === "white") ||
        (validMove.color === "w" && orientation === "black");

      setFen(GameService.fen);
      const payload = SaveMoveInputSchema.parse({
        isOpponentMove: wasOpponentMove,
        fen,
        move: `${validMove.from}${validMove.to}`,
      });
      console.log("recording move", payload);
      await fetch("api/moves/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

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

  function onNavigate(move: Move) {
    GameService.backTo(move);
    setFen(GameService.fen);
  }

  return (
    <>
      <Flex direction="row" gap="20">
        <Flex direction="column" align="center" gap="10">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={orientation}
          />
          <Button onClick={flip}>flip board</Button>
        </Flex>
        <Moves
          bookMoves={bookMoves}
          showBookMoves={true}
          moves={moves}
          onNavigate={onNavigate}
          onPlay={makeMove}
        ></Moves>
      </Flex>
    </>
  );
}
