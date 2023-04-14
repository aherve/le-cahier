import type { GameReport } from '~/schemas/game-report'
import type { LichessGame } from '~/schemas/lichess'

import { RepeatIcon } from '@chakra-ui/icons'
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
  Button,
  Spinner,
} from '@chakra-ui/react'
import { useFetcher } from '@remix-run/react'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { BsCircle, BsCircleFill } from 'react-icons/bs'
import { GiBulletBill, GiRabbit } from 'react-icons/gi'
import { SiStackblitz } from 'react-icons/si'

import LichessLink from './lichess-link'

import { GameReportSchema, MissedMoveSchema } from '~/schemas/game-report'
import { LichessGameSchema } from '~/schemas/lichess'

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
                <Th> Type</Th>
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
  const [reloader, setReloader] = useState(Date.now())

  async function cleanGameReport() {
    fetcher.data = null
    await fetch('api/games/clean-report', {
      method: 'POST',
      body: JSON.stringify({ gameId: game.id }),
    })
    setReloader(Date.now())
  }

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/api/games/analyze?id=${game.id}`)
    }
  }, [fetcher, game, reloader])

  const report = GameReportSchema.nullable().optional().parse(fetcher.data)
  const lichessUsername = report?.lichessUsername

  return (
    <Tr>
      <Td>{moment(game.createdAt).fromNow()}</Td>
      <Td>
        <Flex direction="row" justify="space-between">
          {game.speed === 'blitz' && <SiStackblitz />}
          {game.speed === 'bullet' && <GiBulletBill />}
          {game.speed === 'rapid' && <GiRabbit />}
          {game.players.white.user.name === lichessUsername && <BsCircle />}
          {game.players.black.user.name === lichessUsername && <BsCircleFill />}
        </Flex>
      </Td>
      <Td>
        {game.players.white.user.name} ({game.players.white.rating})
      </Td>
      <Td>
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
      <Td>
        <Button size="xs" onClick={cleanGameReport}>
          <RepeatIcon />
        </Button>
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
    .map((m) => `expected ${m.expected.join(', ')}, but ${m.played} was played`)
    .join('. ')

  if (failedCount === 1) {
    return (
      <Text color="red.500">
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
