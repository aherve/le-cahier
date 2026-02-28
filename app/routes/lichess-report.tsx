import type { MetaFunction } from '@remix-run/node';
import type { GameReport } from '~/schemas/game-report';
import type { LichessGame } from '~/schemas/lichess';

import {
  Text,
  Flex,
  Table,
  Box,
  Tag,
  Button,
  Spinner,
  VStack,
  SkeletonText,
  Tooltip,
} from '@chakra-ui/react';
import { useFetcher } from '@remix-run/react';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { BsCircle, BsCircleFill } from 'react-icons/bs';
import { GiBulletBill, GiRabbit, GiTortoise } from 'react-icons/gi';
import { MdRefresh } from 'react-icons/md';
import { SiStackblitz } from 'react-icons/si';

import LichessLink from '../components/lichess-link';

import { ExploreButton } from '~/components/explore-button';
import { GameReportSchema, MissedMoveSchema } from '~/schemas/game-report';
import { LichessGameSchema } from '~/schemas/lichess';

export const meta: MetaFunction = ({ matches }) => {
  const parentMeta = matches.flatMap(match => match.meta ?? []);
  return [
    ...parentMeta.filter(meta => !('title' in meta) && !(('name' in meta) && meta.name === 'description')),
    { title: 'Lichess Report | Le Cahier' },
    { name: 'description', content: 'Analyzing your lichess games' },
  ];
};

export default function LichessReport() {
  const gameListFetcher = useFetcher();
  const [games, setGames] = useState<LichessGame[]>([]);

  useEffect(() => {
    if (gameListFetcher.state === 'idle' && gameListFetcher.data == null) {
      if (mixpanel.config) {
        mixpanel.track('get lichess report');
      }
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
    if (mixpanel.config) {
      mixpanel.track('load more lichess games');
    }
    const oldTimestamp = Math.min(...games.map((g) => g.createdAt));
    gameListFetcher.load(`/api/lichess/games?until=${oldTimestamp}`);
  }

  return (
    <>
      <VStack gap={5} p="10" maxW="1200px" mx="auto">
        <Table.Root size="sm" striped interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader> Date</Table.ColumnHeader>
              <Table.ColumnHeader> Type</Table.ColumnHeader>
              <Table.ColumnHeader> Opening</Table.ColumnHeader>
              <Table.ColumnHeader> report</Table.ColumnHeader>
              <Table.ColumnHeader> </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {games.map((game) => (
              <GameItem game={game} key={game.id}></GameItem>
            ))}
          </Table.Body>
        </Table.Root>
        <Box>
          {gameListFetcher.state !== 'idle' && <Spinner />}
          {gameListFetcher.state === 'idle' && (
            <Button variant="outline" onClick={LoadMore}>
              Load More
            </Button>
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
    <Table.Row>
      <Table.Cell>{moment(game.createdAt).fromNow()}</Table.Cell>
      <Table.Cell>
        <Flex align="center" justify="center">
          {game.speed === 'blitz' && <SiStackblitz />}
          {game.speed === 'bullet' && <GiBulletBill />}
          {game.speed === 'rapid' && <GiRabbit />}
          {game.speed === 'classical' && <GiTortoise />}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Flex align="center" gap="2">
          <Box flexShrink={0}>
            {getPlayerOrientation(game, report) === 'white' && <BsCircle />}
            {getPlayerOrientation(game, report) === 'black' && <BsCircleFill />}
          </Box>
          <Text>{game.opening.name}</Text>
        </Flex>
      </Table.Cell>
      <Table.Cell>
        {fetcher.state === 'loading' ? (
          <Spinner size="sm" />
        ) : (
          !!report && (
            <GameReportComponent
              game={game}
              report={report}
            ></GameReportComponent>
          )
        )}
      </Table.Cell>
      <Table.Cell>
        <Flex align="center" gap="2">
          <LichessLink
            gameId={game.id}
            moveIndex={firstFailIndex(report) || firstDeviationIndex}
            orientation={getPlayerOrientation(game, report) ?? 'white'}
          ></LichessLink>
          {GameExploreButton({ game, report })}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button size="xs" onClick={cleanGameReport} variant="ghost">
              <MdRefresh />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>reset game analysis</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Table.Cell>
    </Table.Row>
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
            <Tag.Root colorPalette="orange" size="sm">
              <Tag.Label>Unknown variation</Tag.Label>
            </Tag.Root>
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
  if (
    'user' in game.players.white &&
    game.players.white.user.name === report?.lichessUsername
  )
    return 'white';
  if (
    'user' in game.players.black &&
    game.players.black.user.name === report?.lichessUsername
  )
    return 'black';
  return undefined;
}

function TableSkeleton() {
  return (
    <VStack gap={5} p="10" maxW="1200px" mx="auto">
      <Table.Root size="sm" striped interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader> Date</Table.ColumnHeader>
            <Table.ColumnHeader> Type</Table.ColumnHeader>
            <Table.ColumnHeader> white</Table.ColumnHeader>
            <Table.ColumnHeader> black</Table.ColumnHeader>
            <Table.ColumnHeader> report</Table.ColumnHeader>
            <Table.ColumnHeader> </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {[1, 2, 3, 4, 5].map((i) => (
            <Table.Row key={i}>
              <Table.Cell>
                <SkeletonText width="5em" />
              </Table.Cell>
              <Table.Cell>
                <SkeletonText width="3em" />
              </Table.Cell>
              <Table.Cell>
                <SkeletonText width="18em" />
              </Table.Cell>
              <Table.Cell>
                <SkeletonText width="18em" />
              </Table.Cell>
              <Table.Cell>
                <SkeletonText width="4em" />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </VStack>
  );
}
