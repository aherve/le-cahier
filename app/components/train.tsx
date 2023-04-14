import type { TrainMessageInputType } from './train-message'
import type { Move } from 'chess.js'
import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types'
import type { GetChallengeOutput } from '~/routes/api/moves/challenge'

import { EditIcon, RepeatIcon } from '@chakra-ui/icons'
import { Button, Code, Flex } from '@chakra-ui/react'
import { useFetcher } from '@remix-run/react'
import { Chess } from 'chess.js'
import { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'

import LichessLink from './lichess-link'
import Moves from './moves'
import TrainMessage, { TrainMessageInput } from './train-message'

import { GetChallengeOutputSchema } from '~/routes/api/moves/challenge'
import { GameService } from '~/services/gameService'

export function Train(props: {
  orientation: BoardOrientation
  startRecording: (fen: string) => void
  startingMove?: Move
}) {
  const [fen, setFen] = useState(GameService.fen)
  const [msg, setMsg] = useState<TrainMessageInputType>('empty')
  const [challenge, setChallenge] = useState<GetChallengeOutput | null>(null)

  const turn = GameService.turn
  const isPlayerTurn =
    (props.orientation === 'white' && turn === 'w') ||
    (props.orientation === 'black' && turn === 'b')

  const fetcher = useFetcher()
  const moves = GameService.moves

  const hints = (challenge?.expectedMoves ?? [])
    .map((m) => {
      try {
        const g = new Chess(fen)
        const move = g.move(m)
        return move.san
      } catch {
        return null
      }
    })
    .filter(Boolean) as string[]

  useEffect(() => {
    if (!isPlayerTurn && fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/api/moves/challenge?fen=${encodeURIComponent(fen)}`)
    }

    if (!isPlayerTurn && fetcher.state === 'idle' && fetcher.data) {
      const data = GetChallengeOutputSchema.parse(fetcher.data)
      if (!data.challengeMove) {
        setMsg(TrainMessageInput.enum.noMoreData)
      } else {
        GameService.makeMove(data.challengeMove)
        fetcher.data = null
        setChallenge(data)
        setMsg(TrainMessageInput.enum.yourTurn)
        setFen(GameService.fen)
      }
    }
  }, [fen, fetcher, props.orientation, turn, isPlayerTurn])

  function onNavigate(move: Move) {
    GameService.backTo(move)
    fetcher.data = null
    setChallenge(null)
    setFen(GameService.fen)
  }

  function makeMove(move: string | { from: Square; to: Square }): boolean {
    try {
      GameService.makeMove(move)
      setFen(GameService.fen)
      return true
    } catch {
      return false
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (!challenge || challenge.expectedMoves.length === 0) {
      return makeMove({ from: sourceSquare, to: targetSquare })
    } else if (
      challenge.expectedMoves.includes(`${sourceSquare}${targetSquare}`)
    ) {
      return makeMove({ from: sourceSquare, to: targetSquare })
    } else {
      setMsg(TrainMessageInput.enum.nope)
      return false
    }
  }

  function again() {
    if (props.startingMove) {
      GameService.backTo(props.startingMove)
    } else {
      GameService.reset()
    }
    fetcher.data = null
    setChallenge(null)
    setFen(GameService.fen)
  }

  function showHint() {
    if (hints.length === 0) {
      return
    }
    setMsg(TrainMessageInput.enum.hint)
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <TrainMessage type={msg} hints={hints} />
        <Flex direction="row" gap="20">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={props.orientation}
          />
          <Moves
            showBookMoves={false}
            moves={moves}
            onNavigate={onNavigate}
          ></Moves>
        </Flex>
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
          <Button onClick={showHint}>get hint</Button>
          <LichessLink fen={fen}></LichessLink>
        </Flex>
        <Code>{fen}</Code>
      </Flex>
    </>
  )
}
