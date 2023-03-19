import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type {
  BoardOrientation,
  Square,
} from "react-chessboard/dist/chessboard/types";
import type { GetChallengeOutput } from "~/routes/api/moves/challenge";
import { GetChallengeOutputSchema } from "~/routes/api/moves/challenge";
import { Box, Button, Flex } from "@chakra-ui/react";

export function Train(props: {
  orientation: BoardOrientation;
  startRecording: (fen: string) => void;
}) {
  const [fen, setFen] = useState(new Chess().fen());
  const [msg, setMsg] = useState("");
  const [challenge, setChallenge] = useState<GetChallengeOutput | null>(null);

  const turn = new Chess(fen).turn();

  useEffect(() => {
    async function makeOpponentMove() {
      const response = await fetch(
        `api/moves/challenge?fen=${encodeURIComponent(fen)}`
      );
      const challenge = GetChallengeOutputSchema.parse(await response.json());
      setChallenge(challenge);
      if (challenge.challengeMove) {
        const g = new Chess(fen);
        g.move(challenge.challengeMove);
        setFen(g.fen());
        setMsg("Your turn");
      } else {
        setMsg("No more data");
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
    if (!challenge) {
      return makeMove({ from: sourceSquare, to: targetSquare });
    } else if (
      challenge.expectedMoves.includes(`${sourceSquare}${targetSquare}`)
    ) {
      return makeMove({ from: sourceSquare, to: targetSquare });
    } else {
      setMsg("NOPE");
      return false;
    }
  }

  return (
    <>
      <Flex direction="column" align="center" gap="10">
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardWidth={400}
          boardOrientation={props.orientation}
        />
        <Box>
          <Button onClick={() => props.startRecording(fen)}>
            {" "}
            record more moves from there{" "}
          </Button>
        </Box>
        <Box>{msg}</Box>
      </Flex>
    </>
  );
}
