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
} from '@chakra-ui/react';
import { useFetcher, useNavigate } from '@remix-run/react';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { BsCircle, BsCircleFill } from 'react-icons/bs';
import { GiBulletBill, GiRabbit } from 'react-icons/gi';
import { SiStackblitz } from 'react-icons/si';
import { VscBook } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';

import { GameReportSchema, MissedMoveSchema } from '~/schemas/game-report';
import { LichessGameSchema } from '~/schemas/lichess';
import { GameContext } from '~/with-game';

export default function LichessReport() {
  const navigate = useNavigate();
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

  function LoadMore() {
    const oldTimestamp = Math.min(...games.map((g) => g.createdAt));
    gameListFetcher.load(`/api/lichess/games?until=${oldTimestamp}`);
  }

  function explore() {
    navigate('/explore');
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
                <Th> white</Th>
                <Th> black</Th>
                <Th> report</Th>
                <Th> </Th>
              </Tr>
            </Thead>
            <Tbody>
              {games.map((game) => (
                <GameItem
                  game={game}
                  key={game.id}
                  startExplore={explore}
                ></GameItem>
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

function GameItem(props: { game: LichessGame; startExplore: () => void }) {
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
          {getPlayerOrientation(game, report) === 'white' && <BsCircle />}
          {getPlayerOrientation(game, report) === 'black' && <BsCircleFill />}
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
          moveIndex={firstFailIndex(report) || firstDeviationIndex}
          orientation={getPlayerOrientation(game, report) ?? 'white'}
        ></LichessLink>
      </Td>
      <Td>
        {ExploreButton({ game, report, startExplore: props.startExplore })}
      </Td>
      <Td>
        <Button size="xs" onClick={cleanGameReport}>
          <RepeatIcon />
        </Button>
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

  if (failedCount === 1) {
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

function ExploreButton(props: {
  game: LichessGame;
  report?: GameReport | null;
  startExplore: () => void;
}) {
  const { setOrientation } = useContext(GameContext);
  const { reset } = useContext(GameContext);
  const fen = props.report?.firstError?.before;
  if (!fen) {
    return <></>;
  }

  const orientation = getPlayerOrientation(props.game, props.report);

  function explore() {
    if (orientation) {
      setOrientation(orientation);
    }
    reset(fen);
    props.startExplore();
  }

  return (
    <>
      <Button onClick={explore} variant="link">
        <VscBook />
      </Button>
    </>
  );
}

function getPlayerOrientation(game: LichessGame, report?: GameReport | null) {
  if (game.players.white.user.name === report?.lichessUsername) return 'white';
  if (game.players.black.user.name === report?.lichessUsername) return 'black';
  return undefined;
}
