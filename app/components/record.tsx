import { useState } from 'react'
import type { Move } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types'
import { Button, Flex } from '@chakra-ui/react'
import { SaveMoveInputSchema } from '~/routes/api/moves/create'
import Moves from './moves'
import { GameService } from '~/services/gameService'

export function Record() {
  const [fen, setFen] = useState(GameService.fen)
  const [orientation, setOrientation] = useState<BoardOrientation>('white')

  const moves = GameService.moves

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = GameService.makeMove(move)

      const wasOpponentMove =
        (validMove.color === 'b' && orientation === 'white') ||
        (validMove.color === 'w' && orientation === 'black')

      setFen(GameService.fen)
      const payload = SaveMoveInputSchema.parse({
        isOpponentMove: wasOpponentMove,
        fen,
        move: `${validMove.from}${validMove.to}`,
      })
      console.log('recording move', payload)
      await fetch('api/moves/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return validMove
    } catch (e) {
      console.error(e)
      return null
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return makeMove({ from: sourceSquare, to: targetSquare }) !== null
  }

  function flip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'))
  }

  function onNavigate(move: Move) {
    GameService.backTo(move)
    setFen(GameService.fen)
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
        <Moves moves={moves} onNavigate={onNavigate}></Moves>
      </Flex>
    </>
  )
}
