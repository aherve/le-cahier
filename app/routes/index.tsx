import type { Move } from 'chess.js';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Menu,
  MenuItem,
  Box,
  Button,
  Flex,
  Heading,
  MenuButton,
  MenuList,
} from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { BsRecordCircle } from 'react-icons/bs';
import { GiSecretBook } from 'react-icons/gi';
import { MdOutlineSmartToy, MdSettings, MdSmartToy } from 'react-icons/md';
import { SiLichess } from 'react-icons/si';
import { z } from 'zod';

import Explore from '~/components/explore';
import LichessReport from '~/components/lichess-report';
import { Record } from '~/components/record';
import { Train } from '~/components/train';
import { GameService } from '~/services/gameService';

const GameMode = z.enum([
  'explore',
  'lichessReport',
  'recordMoves',
  'trainWithBlack',
  'trainWithWhite',
]);
type GameModeType = z.infer<typeof GameMode>;

export default function Index() {
  const { signOut } = useAuthenticator();
  const [mode, setMode] = useState<GameModeType>(GameMode.enum.explore);
  const [fromLastMove, setFromLastMove] = useState<Move | undefined>();
  const [gameId, setGameId] = useState(Date.now().toString());
  const navigate = useNavigate();

  function startLichessReport() {
    setMode(GameMode.enum.lichessReport);
  }

  function startTraining(
    orientation: BoardOrientation,
    resetBoard: boolean,
    lastMove?: Move,
  ) {
    if (resetBoard) {
      GameService.reset();
    }
    setFromLastMove(lastMove);
    setGameId(Date.now().toString());
    switch (orientation) {
      case 'black':
        return setMode(GameMode.enum.trainWithBlack);
      default:
        return setMode(GameMode.enum.trainWithWhite);
    }
  }

  function startRecordingMoves(resetBoard: boolean) {
    setGameId(Date.now().toString());
    if (resetBoard) {
      GameService.reset();
    }
    setMode(GameMode.enum.recordMoves);
  }
  function startExplore(resetBoard: boolean) {
    setGameId(Date.now().toString());
    if (resetBoard) {
      GameService.reset();
    }
    setMode(GameMode.enum.explore);
  }

  function renderSwitch() {
    switch (mode) {
      case GameMode.enum.trainWithWhite:
        return (
          <Train
            orientation="white"
            key={gameId}
            startRecording={() => startRecordingMoves(false)}
            startingMove={fromLastMove}
          />
        );
      case GameMode.enum.trainWithBlack:
        return (
          <Train
            orientation="black"
            key={gameId}
            startRecording={() => startRecordingMoves(false)}
            startingMove={fromLastMove}
          />
        );
      case GameMode.enum.recordMoves:
        return <Record key={gameId} />;
      case GameMode.enum.lichessReport:
        return <LichessReport></LichessReport>;
      case GameMode.enum.explore:
        return (
          <Explore
            key={gameId}
            startTraining={(orientation, lastMove) =>
              startTraining(orientation, false, lastMove)
            }
          ></Explore>
        );
    }
  }

  return (
    <>
      <Flex height="100vh" direction="column" align="center" gap="10">
        <Flex direction="row" gap={10} align="center" minWidth="max-content">
          <Button
            leftIcon={<GiSecretBook />}
            onClick={() => startExplore(true)}
          >
            Explore
          </Button>
          <Button
            leftIcon={<MdOutlineSmartToy />}
            onClick={() => startTraining('white', true)}
          >
            Train with white
          </Button>
          <Button
            leftIcon={<MdSmartToy />}
            onClick={() => startTraining('black', true)}
          >
            Train with black
          </Button>
          <Button
            leftIcon={<BsRecordCircle />}
            onClick={() => startRecordingMoves(true)}
          >
            Record moves
          </Button>
          <Button leftIcon={<SiLichess />} onClick={startLichessReport}>
            lichess report
          </Button>
          <Menu>
            <MenuButton as={Button}>
              <MdSettings />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/settings')}>
                Settings
              </MenuItem>
              <MenuItem onClick={signOut}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        <Flex>{pageTitle(mode)}</Flex>
        <Flex grow={1} alignItems="center" direction="column">
          {renderSwitch()}
        </Flex>
      </Flex>
    </>
  );
}

function pageTitle(mode: GameModeType) {
  switch (mode) {
    case GameMode.enum.explore:
      return (
        <>
          <Flex direction="row" align="center" gap="5">
            <GiSecretBook size="40" />
            <Heading size="lg">Browsing moves</Heading>
          </Flex>
        </>
      );
    case GameMode.enum.lichessReport:
      return null;
    case GameMode.enum.recordMoves:
      return (
        <>
          <Flex direction="row" align="center" gap="5">
            <BsRecordCircle color="red" size="40" />
            <Heading size="lg">Recording moves</Heading>
          </Flex>
        </>
      );
    case GameMode.enum.trainWithBlack:
    case GameMode.enum.trainWithWhite:
      return (
        <>
          <Flex direction="row" align="center" gap="5">
            <MdOutlineSmartToy size="40" />
            <Heading size="lg">Training mode</Heading>
          </Flex>
        </>
      );
    default:
      return <Box></Box>;
  }
}
