import { Flex, Table, Text, Thead } from '@chakra-ui/react'
import { Heading, List, ListItem, Spinner } from '@chakra-ui/react'
import { useFetcher } from '@remix-run/react'
import { useEffect, useState } from 'react'
import type { LichessGame } from '~/schemas/lichess'

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

  return (
    <>
      <Flex direction="column" justify="center">
        <Heading>Report</Heading>
        <List>
          {games.map((game) => {
            return (
              <ListItem key={game.id}>
                <GameListItem game={game}></GameListItem>
              </ListItem>
            )
          })}
        </List>
      </Flex>
    </>
  )
}
function GameListItem(props: { game: LichessGame }) {
  const { game } = props
  return (
    <>
      <Table>
        <Thead></Thead>
        <Tbody></Tbody>
      </Table>
      <Flex direction="row" justify="space-around">
        <Text flex="1 0 0">
          {game.players.white.user.name}({game.players.white.rating})
        </Text>
        <Text flex="1 0 0">vs</Text>
        <Text flex="1 0 0">
          {' '}
          {game.players.black.user.name}({game.players.black.rating}){' '}
        </Text>
      </Flex>
      <Text></Text>
    </>
  )
}
