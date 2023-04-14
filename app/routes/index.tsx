import type { Move } from 'chess.js'
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types'

import { useAuthenticator } from '@aws-amplify/ui-react'
import { BellIcon, EditIcon, SearchIcon } from '@chakra-ui/icons'
import { Button, Flex } from '@chakra-ui/react'
import { useState } from 'react'
import { FiLogOut } from 'react-icons/fi'
import { z } from 'zod'

import Explore from '~/components/explore'
import LichessReport from '~/components/lichess-report'
import { Record } from '~/components/record'
import { Train } from '~/components/train'
import { GameService } from '~/services/gameService'

const GameMode = z.enum([
  'explore',
  'lichessReport',
  'recordMoves',
  'trainWithBlack',
  'trainWithWhite',
])
type GameModeType = z.infer<typeof GameMode>

export default function Index() {
  const { signOut } = useAuthenticator()
  const [mode, setMode] = useState<GameModeType>(GameMode.enum.explore)
  const [fromLastMove, setFromLastMove] = useState<Move | undefined>()
  const [gameId, setGameId] = useState(Date.now().toString())

  function startLichessReport() {
    setMode(GameMode.enum.lichessReport)
  }

  function startTraining(
    orientation: BoardOrientation,
    resetBoard: boolean,
    lastMove?: Move
  ) {
    if (resetBoard) {
      GameService.reset()
    }
    setFromLastMove(lastMove)
    setGameId(Date.now().toString())
    switch (orientation) {
      case 'black':
        return setMode(GameMode.enum.trainWithBlack)
      default:
        return setMode(GameMode.enum.trainWithWhite)
    }
  }

  function startRecordingMoves(resetBoard: boolean) {
    setGameId(Date.now().toString())
    if (resetBoard) {
      GameService.reset()
    }
    setMode(GameMode.enum.recordMoves)
  }
  function startExplore(resetBoard: boolean) {
    setGameId(Date.now().toString())
    if (resetBoard) {
      GameService.reset()
    }
    setMode(GameMode.enum.explore)
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
        )
      case GameMode.enum.trainWithBlack:
        return (
          <Train
            orientation="black"
            key={gameId}
            startRecording={() => startRecordingMoves(false)}
            startingMove={fromLastMove}
          />
        )
      case GameMode.enum.recordMoves:
        return <Record key={gameId} />
      case GameMode.enum.lichessReport:
        return <LichessReport></LichessReport>
      case GameMode.enum.explore:
        return (
          <Explore
            key={gameId}
            startTraining={(orientation, lastMove) =>
              startTraining(orientation, false, lastMove)
            }
          ></Explore>
        )
    }
  }

  return (
    <>
      <div className="App">
        <Flex height="100vh" direction="column" align="center">
          <Flex direction="row" gap={10} align="center" minWidth="max-content">
            <Button
              leftIcon={<SearchIcon />}
              onClick={() => startExplore(true)}
            >
              Explore
            </Button>
            <Button onClick={() => startTraining('white', true)}>
              Train with white
            </Button>
            <Button onClick={() => startTraining('black', true)}>
              Train with black
            </Button>
            <Button
              leftIcon={<EditIcon />}
              onClick={() => startRecordingMoves(true)}
            >
              Record moves
            </Button>
            <Button leftIcon={<BellIcon />} onClick={startLichessReport}>
              lichess report
            </Button>
            <Button variant="outline" leftIcon={<FiLogOut />} onClick={signOut}>
              Logout
            </Button>
          </Flex>
          <Flex grow={1} alignItems="center">
            {renderSwitch()}
          </Flex>
        </Flex>
      </div>
    </>
  )
}
