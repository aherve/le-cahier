import {
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
import { useEffect, useState } from 'react'
import type { LichessGame } from '~/schemas/lichess'
import { LICHESS_USERNAME } from '~/schemas/lichess'

export default function LichessReport() {
  const fetcher = useFetcher()
  const [games, setGames] = useState<LichessGame[]>([])

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      console.log('fetch here')
      fetcher.load('/api/lichess/games')
    }
    if (fetcher.state === 'idle' && fetcher.data && games.length === 0) {
      setGames(fetcher.data)
    }
  }, [fetcher, games])

  if (fetcher.state === 'loading') {
    return <Spinner />
  }

  const gameColor = (game: LichessGame) => {
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
              </Tr>
            </Thead>
            <Tbody>
              {games.map((game) => {
                return (
                  <Tr key={game.id}>
                    <Td color={gameColor(game)}>
                      {game.players.white.user.name} (
                      {game.players.white.rating})
                    </Td>
                    <Td color={gameColor(game)}>
                      {game.players.black.user.name} (
                      {game.players.black.rating})
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Flex>
    </>
  )
}
