import { z } from "zod";
import { Button, ChakraProvider, Flex } from "@chakra-ui/react";
import { useState } from "react";
import { Train } from "~/components/train";
import { Record } from "~/components/record";

const GameMode = z.enum(["trainWithWhite", "trainWithBlack", "recordMoves"]);
type GameModeType = z.infer<typeof GameMode>;

export default function Index() {
  const [mode, setMode] = useState<GameModeType>(GameMode.enum.trainWithWhite);
  const [gameId, setGameId] = useState(Date.now().toString());

  function ping() {
    fetch(`api/ping`, { method: "POST" }).then((res) => {
      console.log(res);
    });
  }

  function startTrainingWithWhite() {
    setGameId(Date.now().toString());
    setMode(GameMode.enum.trainWithWhite);
  }
  function startTrainingWithBlack() {
    setGameId(Date.now().toString());
    setMode(GameMode.enum.trainWithBlack);
  }
  function startRecordingMoves() {
    setGameId(Date.now().toString());
    setMode(GameMode.enum.recordMoves);
  }

  function renderSwitch() {
    switch (mode) {
      case GameMode.enum.trainWithWhite:
        return <Train orientation="white" key={gameId} />;
      case GameMode.enum.trainWithBlack:
        return <Train orientation="black" key={gameId} />;
      case GameMode.enum.recordMoves:
        return <Record orientation="white" key={gameId} />;
    }
  }

  return (
    <>
      <div className="App">
        <Flex height="100vh" direction="column" align="center">
          <Flex
            direction="row"
            gap={10}
            align="space-between"
            minWidth="max-content"
          >
            <Button onClick={startTrainingWithWhite}>Train with white</Button>
            <Button onClick={startTrainingWithBlack}>Train with black</Button>
            <Button onClick={startRecordingMoves}>Record moves</Button>
          </Flex>
          <Flex grow={1} basis="100%" alignItems="center">
            {renderSwitch()}
          </Flex>
        </Flex>
      </div>
    </>
  );
}
