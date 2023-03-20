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
import { EditIcon, RepeatIcon } from "@chakra-ui/icons";
import LichessLink from "./lichess-link";
import type { TrainMessageInputType } from "./train-message";
import TrainMessage, { TrainMessageInput } from "./train-message";

export function Train(props: {
  orientation: BoardOrientation;
  startRecording: (fen: string) => void;
  initialFen?: string;
}) {
  const [fen, setFen] = useState(props.initialFen ?? new Chess().fen());
  const [msg, setMsg] = useState<TrainMessageInputType>("");
  const [challenge, setChallenge] = useState<GetChallengeOutput | null>(null);

  const turn = new Chess(fen).turn();

  useEffect(() => {
    async function makeOpponentMove() {
      const response = await fetch(
        `api/moves/challenge?fen=${encodeURIComponent(fen)}`
      );
      const challenge = GetChallengeOutputSchema.parse(await response.json());
      console.log(challenge);
      setChallenge(challenge);
      if (challenge.challengeMove) {
        const g = new Chess(fen);
        g.move(challenge.challengeMove);
        setFen(g.fen());
        setMsg(TrainMessageInput.enum.yourTurn);
      } else {
        setMsg(TrainMessageInput.enum.noMoreData);
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
    if (!challenge || challenge.expectedMoves.length === 0) {
      return makeMove({ from: sourceSquare, to: targetSquare });
    } else if (
      challenge.expectedMoves.includes(`${sourceSquare}${targetSquare}`)
    ) {
      return makeMove({ from: sourceSquare, to: targetSquare });
    } else {
      console.log("expected", challenge.expectedMoves);
      setMsg(TrainMessageInput.enum.nope);
      return false;
    }
  }

  function again() {
    setFen(props.initialFen ?? new Chess().fen());
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <TrainMessage type={msg} />
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardWidth={400}
          boardOrientation={props.orientation}
        />
        <Flex direction="row" gap="5" align="center">
          <Button
            leftIcon={<EditIcon />}
            onClick={() => props.startRecording(fen)}
          >
            Add move from this position
          </Button>
          <Button leftIcon={<RepeatIcon />} onClick={again}>
            Again
          </Button>
          <LichessLink fen={fen}></LichessLink>
        </Flex>
      </Flex>
    </>
  );
}
