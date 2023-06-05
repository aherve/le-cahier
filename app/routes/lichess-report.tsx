import type { MetaFunction } from '@remix-run/node';
import type { GameReport } from '~/schemas/game-report';
import type { LichessGame } from '~/schemas/lichess';

import { RepeatIcon } from '@chakra-ui/icons';
import {
  Text,
  Flex,
  Table,
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
  VStack,
  SkeletonText,
  Wrap,
  WrapItem,
  Tooltip,
} from '@chakra-ui/react';
import { useFetcher } from '@remix-run/react';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { BsCircle, BsCircleFill } from 'react-icons/bs';
import { GiBulletBill, GiRabbit } from 'react-icons/gi';
import { SiStackblitz } from 'react-icons/si';

import LichessLink from '../components/lichess-link';

import { ExploreButton } from '~/components/explore-button';
import { GameReportSchema, MissedMoveSchema } from '~/schemas/game-report';
import { LichessGameSchema } from '~/schemas/lichess';

export const meta: MetaFunction = () => {
  return {
    title: 'Lichess Report | Le Cahier',
    description: 'Analyzing your lichess games',
  };
};

export default function LichessReport() {
  const gameListFetcher = useFetcher();
  const [games, setGames] = useState<LichessGame[]>([]);

  useEffect(() => {
    if (gameListFetcher.state === 'idle' && gameListFetcher.data == null) {
      gameListFetcher.load('/api/lichess/games');
    }
  }, [gameListFetcher]);

  useEffect(() => {
    if (gameListFetcher.data) {
      setGames((prev) => [
        ...prev,
        ...LichessGameSchema.array().parse(gameListFetcher.data),
      ]);
    }
  }, [gameListFetcher.data]);

  if (gameListFetcher.state === 'loading' && games.length === 0) {
    return <TableSkeleton />;
  }

  function LoadMore() {
    const oldTimestamp = Math.min(...games.map((g) => g.createdAt));
    gameListFetcher.load(`/api/lichess/games?until=${oldTimestamp}`);
  }

  return (
    <>
      <VStack spacing={5} paddingTop="10">
        <TableContainer>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th> Date</Th>
                <Th> Type</Th>
                <Th> Opening</Th>
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
        <Box>
          {gameListFetcher.state !== 'idle' && <Spinner />}
          {gameListFetcher.state === 'idle' && (
            <Button onClick={LoadMore}>Load More</Button>
          )}
        </Box>
      </VStack>
    </>
  );
}

function GameItem(props: { game: LichessGame }) {
  const { game } = props;
  const fetcher = useFetcher();
  const [reloader, setReloader] = useState(Date.now());

  async function cleanGameReport() {
    fetcher.data = null;
    await fetch('api/games/clean-report', {
      method: 'POST',
      body: JSON.stringify({ gameId: game.id }),
    });
    setReloader(Date.now());
  }

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/api/games/analyze?id=${game.id}`);
    }
  }, [fetcher, game, reloader]);

  const report = GameReportSchema.nullable().optional().parse(fetcher.data);
  const firstDeviationIndex =
    (report?.movesReport.filter((m) => m.status === 'success').length ?? 0) *
      2 +
      1 ?? 0;

  return (
    <Tr>
      <Td>{moment(game.createdAt).fromNow()}</Td>
      <Td>
        <Flex direction="row" justify="space-between">
          {game.speed === 'blitz' && <SiStackblitz />}
          {game.speed === 'bullet' && <GiBulletBill />}
          {game.speed === 'rapid' && <GiRabbit />}
        </Flex>
      </Td>
      <Td>
        <Wrap>
          {getPlayerOrientation(game, report) === 'white' && <BsCircle />}
          {getPlayerOrientation(game, report) === 'black' && <BsCircleFill />}
          <WrapItem>{game.opening.name}</WrapItem>
        </Wrap>
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
        <Wrap>
          <WrapItem>
            <LichessLink
              gameId={game.id}
              moveIndex={firstFailIndex(report) || firstDeviationIndex}
              orientation={getPlayerOrientation(game, report) ?? 'white'}
            ></LichessLink>
          </WrapItem>
          <WrapItem>{GameExploreButton({ game, report })}</WrapItem>
        </Wrap>
      </Td>
      <Td>
        <Tooltip label="reset game analysis">
          <Button size="xs" onClick={cleanGameReport} variant="ghost">
            <RepeatIcon />
          </Button>
        </Tooltip>
      </Td>
    </Tr>
  );
}

function firstFailIndex(report?: GameReport | null) {
  const found = report?.movesReport.findIndex((m) => m.status === 'failed');
  return found && found > 1 ? found : undefined;
}

function GameReportComponent(props: { game: LichessGame; report: GameReport }) {
  const successCount = props.report.movesReport.filter(
    (m) => m.status === 'success',
  ).length;
  const failedCount = props.report.movesReport.filter(
    (m) => m.status === 'failed',
  ).length;

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
    );
  }

  const explanation = props.report.movesReport
    .filter((m) => m.status === 'failed')
    .map((m) => MissedMoveSchema.parse(m))
    .map((m) => `expected ${m.expected.join(', ')}, but ${m.played} was played`)
    .join('. ');

  if (failedCount >= 1) {
    return (
      <Text color="red.500">
        {' '}
        {failedCount} miss. {explanation}
      </Text>
    );
  }

  return (
    <Text>
      {failedCount} misses. {explanation}
    </Text>
  );
}

function GameExploreButton(props: {
  game: LichessGame;
  report?: GameReport | null;
}) {
  const fen = props.report?.firstError?.before;
  if (!fen) {
    return <></>;
  }

  const orientation = getPlayerOrientation(props.game, props.report);

  return <ExploreButton fen={fen} orientation={orientation} variant="icon" />;
}

function getPlayerOrientation(game: LichessGame, report?: GameReport | null) {
  if (game.players.white.user.name === report?.lichessUsername) return 'white';
  if (game.players.black.user.name === report?.lichessUsername) return 'black';
  return undefined;
}

function TableSkeleton() {
  return (
    <VStack spacing={5} paddingTop="10">
      <TableContainer>
        <Table size="sm" variant="simple">
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
            {[1, 2, 3, 4, 5].map((i) => (
              <Tr key={i}>
                <Td>
                  <SkeletonText width="5em" />
                </Td>
                <Td>
                  <SkeletonText width="3em" />
                </Td>
                <Td>
                  <SkeletonText width="18em" />
                </Td>
                <Td>
                  <SkeletonText width="18em" />
                </Td>
                <Td>
                  <SkeletonText width="4em" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );
}
