import { RepeatIcon } from '@chakra-ui/icons'
import { Button, Code, Flex, Spacer } from '@chakra-ui/react'
import type { Move, Square } from 'chess.js'
import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types'
import LichessLink from './lichess-link'
import Moves from './moves'

import { GameService } from '~/services/gameService'

export default function Explore(props: {
  orientation?: BoardOrientation
  startTraining: (orientation: BoardOrientation, lastMove: Move) => void
}) {
  const [fen, setFen] = useState(GameService.fen)
  const [orientation, setOrientation] = useState<BoardOrientation>(
    props.orientation ?? 'white'
  )

  const moves = GameService.moves
  const lastMove = moves[moves.length - 1]

  function flip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  function onNavigate(move: Move) {
    GameService.backTo(move)
    setFen(GameService.fen)
  }

  function onDrop(from: Square, to: Square) {
    try {
      GameService.makeMove({ from, to })
      setFen(GameService.fen)
      return true
    } catch {
      return false
    }
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <Flex
          direction="column"
          align="center"
          justify="space-between"
          gap="10"
          grow="1"
        >
          <Flex direction="row" gap="20">
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardWidth={400}
              boardOrientation={orientation}
            />
            <Moves moves={moves} onNavigate={onNavigate}></Moves>
          </Flex>
          <Flex direction="row" gap="5" align="center">
            <Button leftIcon={<RepeatIcon />} onClick={flip}>
              flip board
            </Button>
            <Button onClick={() => props.startTraining(orientation, lastMove)}>
              Train from this position
            </Button>
            <LichessLink fen={fen}></LichessLink>
          </Flex>
        </Flex>
        <Spacer />
        <Code>{fen}</Code>
      </Flex>
    </>
  )
}
