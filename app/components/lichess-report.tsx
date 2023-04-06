import {
  Text,
  Flex,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { Heading, Spinner } from '@chakra-ui/react'
import { useFetcher } from '@remix-run/react'
import { useEffect } from 'react'
import type { LichessGame } from '~/schemas/lichess'
import { LichessGameSchema } from '~/schemas/lichess'
import { LICHESS_USERNAME } from '~/schemas/lichess'

export default function LichessReport() {
  const gameListFetcher = useFetcher()

  useEffect(() => {
    if (gameListFetcher.state === 'idle' && gameListFetcher.data == null) {
      gameListFetcher.load('/api/lichess/games')
    }
  }, [gameListFetcher])

  const games = LichessGameSchema.array().parse(gameListFetcher.data ?? [])

  if (gameListFetcher.state === 'loading' && games.length === 0) {
    return <Spinner />
  }

  return (
    <>
      <Flex direction="column" justify="center">
        <Heading as="h3">Report</Heading>

        <TableContainer>
          <Table size="sm" variant="simple">
            <TableCaption>Recent games</TableCaption>
            <Thead>
              <Tr>
                <Th> white</Th>
                <Th> black</Th>
                <Th> report</Th>
              </Tr>
            </Thead>
            <Tbody>
              {games.map((game) => (
                <GameItem game={game} key={game.id}></GameItem>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Flex>
    </>
  )
}

function GameItem(props: { game: LichessGame }) {
  const { game } = props
  const fetcher = useFetcher()

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/api/games/analyze?id=${game.id}`)
    }
  }, [fetcher, game])

  const report = fetcher.data

  return (
    <Tr>
      <Td color={gameColor(game)}>
        {game.players.white.user.name} ({game.players.white.rating})
      </Td>
      <Td color={gameColor(game)}>
        {game.players.black.user.name} ({game.players.black.rating})
      </Td>
      <Td>
        {fetcher.state === 'loading' && <Spinner size="sm" />}
        {!!report && <Text>report is {JSON.stringify(report)}</Text>}
      </Td>
    </Tr>
  )
}

function gameColor(game: LichessGame) {
  const won =
    (game.winner === 'white' &&
      game.players.white.user.name === LICHESS_USERNAME) ||
    (game.winner === 'black' &&
      game.players.black.user.name === LICHESS_USERNAME)
  const drew = game.winner === undefined
  const lost = !won && !drew

  if (won) return 'green.500'
  if (lost) return 'red.500'
  return 'gray.500'
}
