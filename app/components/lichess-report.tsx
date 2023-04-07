import { BsCircle, BsCircleFill } from 'react-icons/bs'
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
  Box,
  Tag,
} from '@chakra-ui/react'
import { Spinner } from '@chakra-ui/react'
import { useFetcher } from '@remix-run/react'
import moment from 'moment'
import { useEffect } from 'react'
import type { GameReport } from '~/schemas/game-report'
import { MissedMoveSchema } from '~/schemas/game-report'
import type { LichessGame } from '~/schemas/lichess'
import { LichessGameSchema } from '~/schemas/lichess'
import { LICHESS_USERNAME } from '~/schemas/lichess'
import LichessLink from './lichess-link'

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
        <TableContainer>
          <Table size="sm" variant="simple">
            <TableCaption>Recent games</TableCaption>
            <Thead>
              <Tr>
                <Th> Date</Th>
                <Th> Color</Th>
                <Th> white</Th>
                <Th> black</Th>
                <Th> report</Th>
                <Th> </Th>
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
      <Td>{moment(game.createdAt).fromNow()}</Td>
      <Td>
        {game.players.white.user.name === LICHESS_USERNAME ? (
          <BsCircle />
        ) : (
          <BsCircleFill />
        )}
      </Td>
      <Td color={gameColor(game)}>
        {game.players.white.user.name} ({game.players.white.rating})
      </Td>
      <Td color={gameColor(game)}>
        {game.players.black.user.name} ({game.players.black.rating})
      </Td>
      <Td>
        {fetcher.state === 'loading' && <Spinner size="sm" />}
        {!!report && (
          <GameReportComponent
            game={game}
            report={report}
          ></GameReportComponent>
        )}
      </Td>
      <Td>
        <LichessLink
          gameId={game.id}
          moveIndex={firstFailIndex(report)}
        ></LichessLink>
      </Td>
    </Tr>
  )
}

function firstFailIndex(report?: GameReport) {
  const found = report?.movesReport.findIndex((m) => m.status === 'failed')
  return found && found > 1 ? found : undefined
}

function GameReportComponent(props: { game: LichessGame; report: GameReport }) {
  const successCount = props.report.movesReport.filter(
    (m) => m.status === 'success'
  ).length
  const failedCount = props.report.movesReport.filter(
    (m) => m.status === 'failed'
  ).length

  if (failedCount === 0) {
    return (
      <>
        <Flex direction="row" justify="space-between">
          <Box color="green.500">{successCount} moves played</Box>
          {successCount < 4 && (
            <Tag colorScheme="orange" size="sm">
              Unknown variation
            </Tag>
          )}
        </Flex>
      </>
    )
  }

  const explanation = props.report.movesReport
    .filter((m) => m.status === 'failed')
    .map((m) => MissedMoveSchema.parse(m))
    .map(
      (m) => `${m.expected.join(', ')} was expected, but ${m.played} was played`
    )
    .join('. ')

  if (failedCount === 1) {
    return (
      <Text>
        {' '}
        {failedCount} miss. {explanation}
      </Text>
    )
  }

  return (
    <Text>
      {failedCount} misses. {explanation}
    </Text>
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
