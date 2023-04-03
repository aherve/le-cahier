import { z } from "zod";
import { Button, Flex } from "@chakra-ui/react";
import { useState } from "react";
import { Train } from "~/components/train";
import { Record } from "~/components/record";
import Explore from "~/components/explore";
import { Chess } from "chess.js";
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import { BasicAuthHeaders, basicAuthLoader } from "~/services/utils";
import { useLoaderData } from "@remix-run/react";

const GameMode = z.enum([
  "trainWithWhite",
  "trainWithBlack",
  "recordMoves",
  "explore",
]);
type GameModeType = z.infer<typeof GameMode>;

export const headers = BasicAuthHeaders;
export const loader = basicAuthLoader;

export default function Index() {
  const [mode, setMode] = useState<GameModeType>(GameMode.enum.explore);
  const [gameId, setGameId] = useState(Date.now().toString());
  const [initialFen, setInitialFen] = useState<string | undefined>();

  if (!useLoaderData().authorized) {
    return <div>Not authorized</div>;
  }

  function startTraining(fen: string, orientation: BoardOrientation) {
    switch (orientation) {
      case "black":
        return startTrainingWithBlack(fen);
      default:
        return startTrainingWithWhite(fen);
    }
  }

  function startTrainingWithWhite(fen?: string) {
    setInitialFen(fen ?? new Chess().fen());
    setMode(GameMode.enum.trainWithWhite);
    setGameId(Date.now().toString());
  }
  function startTrainingWithBlack(fen?: string) {
    setInitialFen(fen ?? new Chess().fen());
    setMode(GameMode.enum.trainWithBlack);
    setGameId(Date.now().toString());
  }
  function startRecordingMoves(fen?: string) {
    setInitialFen(fen);
    setMode(GameMode.enum.recordMoves);
    setGameId(Date.now().toString());
  }
  function startExplore(fen?: string) {
    setInitialFen(fen ?? new Chess().fen());
    setMode(GameMode.enum.explore);
    setGameId(Date.now().toString());
  }

  function renderSwitch() {
    switch (mode) {
      case GameMode.enum.trainWithWhite:
        return (
          <Train
            orientation="white"
            key={gameId}
            startRecording={startRecordingMoves}
            initialFen={initialFen}
          />
        );
      case GameMode.enum.trainWithBlack:
        return (
          <Train
            orientation="black"
            key={gameId}
            startRecording={startRecordingMoves}
            initialFen={initialFen}
          />
        );
      case GameMode.enum.recordMoves:
        return <Record key={gameId} initialFen={initialFen} />;
      case GameMode.enum.explore:
        return (
          <Explore
            startTraining={startTraining}
            initialFen={initialFen}
          ></Explore>
        );
    }
  }

  return (
    <>
      <div className="App">
        <Flex height="100vh" direction="column" align="center">
          <Flex direction="row" gap={10} align="center" minWidth="max-content">
            <Button onClick={() => startExplore()}>Explore</Button>
            <Button onClick={() => startTrainingWithWhite()}>
              Train with white
            </Button>
            <Button onClick={() => startTrainingWithBlack()}>
              Train with black
            </Button>
            <Button onClick={() => startRecordingMoves()}>Record moves</Button>
          </Flex>
          <Flex grow={1} alignItems="center">
            {renderSwitch()}
          </Flex>
        </Flex>
      </div>
    </>
  );
}
