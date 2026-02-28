import type { TrainMessageInputType } from '../components/train-message';
import type { MetaFunction } from '@remix-run/node';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import type { GetChallengeOutput } from '~/routes/api.moves.challenge';

import { Button, GridItem, Heading, Tooltip, Wrap } from '@chakra-ui/react';
import { useFetcher, useSearchParams } from '@remix-run/react';
import { Chess } from 'chess.js';
import mixpanel from 'mixpanel-browser';
import { useCallback, useContext, useEffect, useState } from 'react';
import { FaAnchor } from 'react-icons/fa';
import { GoLightBulb } from 'react-icons/go';
import { MdOutlineSmartToy } from 'react-icons/md';
import { VscDebugRestart } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';
import Moves from '../components/moves';
import TrainMessage, { TrainMessageInput } from '../components/train-message';

import { ChessGrid } from '~/components/chess-grid';
import { ExploreButton } from '~/components/explore-button';
import { FlipBoardButton } from '~/components/flip-board-button';
import { GetChallengeOutputSchema } from '~/routes/api.moves.challenge';
import { GameContext } from '~/with-game';

export const meta: MetaFunction = () => {
  return [
    { title: 'Train | Le Cahier' },
    { name: 'description', content: 'How well do you know your openings?' },
  ];
};

export default function Train() {
  const {
    fen,
    turn,
    backTo,
    makeMove,
    isValidMove,
    orientation,
    reset,
    soundEnabled,
  } = useContext(GameContext);
  const [params] = useSearchParams();
  const [startingFEN, setStartingFEN] = useState(params.get('from'));
  const [msg, setMsg] = useState<TrainMessageInputType>('yourTurn');
  const [challenge, setChallenge] = useState<GetChallengeOutput | null>(null);

  const errorSound = new Audio('/sounds/Error.ogg');

  const isPlayerTurn =
    (orientation === 'white' && turn === 'w') ||
    (orientation === 'black' && turn === 'b');

  const fetcher = useFetcher();

  const hints = (challenge?.expectedMoves ?? [])
    .map((m) => {
      try {
        const g = new Chess(fen);
        const move = g.move(m);
        return move.san;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as string[];

  useEffect(() => {
    const practiceCompleteSound = new Audio('/sounds/PracticeComplete.ogg');
    if (!isPlayerTurn && fetcher.state === 'idle' && fetcher.data == null) {
      if (mixpanel.config) {
        mixpanel.track('get-challenge');
      }

      fetcher.load(`/api/moves/challenge?fen=${encodeURIComponent(fen)}`);
    }

    if (!isPlayerTurn && fetcher.state === 'idle' && fetcher.data) {
      const data = GetChallengeOutputSchema.parse(fetcher.data);
      if (!data.challengeMove) {
        setMsg(TrainMessageInput.enum.noMoreData);
        soundEnabled && practiceCompleteSound.play();
      } else {
        makeMove(data.challengeMove);
        fetcher.data = null;
        setChallenge(data);
        setMsg(TrainMessageInput.enum.yourTurn);
      }
    }
  }, [fen, fetcher, orientation, turn, isPlayerTurn, makeMove, soundEnabled]);

  const ankiUpdate = useCallback(
    (isSuccess: boolean) => {
      fetch('/api/moves/update-anki', {
        method: 'POST',
        body: JSON.stringify({ fen, isSuccess }),
      }).then(() => {
        console.log('anki updated');
      });
    },
    [fen],
  );

  function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
    // Discard invalid moves
    if (!isValidMove({ from: sourceSquare, to: targetSquare })) {
      return false;
    }

    if (!challenge || challenge.expectedMoves.length === 0) {
      makeMove({ from: sourceSquare, to: targetSquare });
      return true;
    } else if (
      challenge.expectedMoves.includes(`${sourceSquare}${targetSquare}`)
    ) {
      ankiUpdate(true);
      makeMove({ from: sourceSquare, to: targetSquare });
      return true;
    } else {
      soundEnabled && errorSound.play();
      ankiUpdate(false);
      setMsg(TrainMessageInput.enum.nope);
      return false;
    }
  }

  function again() {
    if (mixpanel.config) {
      mixpanel.track('again');
    }
    if (startingFEN) {
      backTo(startingFEN);
    } else {
      reset();
    }
    fetcher.data = null;
    setChallenge(null);
  }

  function showHint() {
    if (mixpanel.config) {
      mixpanel.track('show-hint');
    }
    if (hints.length === 0) {
      return;
    }
    setMsg(TrainMessageInput.enum.hint);
  }

  function anchor() {
    if (mixpanel.config) {
      mixpanel.track('anchor');
    }
    setStartingFEN(fen);
  }

  return (
    <ChessGrid fen={fen} onPieceDrop={onDrop} orientation={orientation}>
      <GridItem
        gridArea="title"
        alignSelf="center"
        justifySelf="center"
        paddingTop="5"
      >
        <Wrap>
          <MdOutlineSmartToy size="40" />
          <Heading size="lg">Training mode</Heading>
        </Wrap>
      </GridItem>

      <GridItem gridArea="message" alignSelf="center" justifySelf="center">
        <TrainMessage type={msg} hints={hints} />
      </GridItem>

      <GridItem gridArea="moves" maxW="300px">
        <Moves showBookMoves={false} showComments={false}></Moves>
      </GridItem>

      <GridItem gridArea="actions">
        <Wrap align="center" justify="center">
          <FlipBoardButton />
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button onClick={anchor}>
                <FaAnchor />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>Set current position as the new starting point for training</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button leftIcon={<VscDebugRestart />} onClick={again}>
                Again
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>(re)start from anchored or starting position</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
          <Button leftIcon={<GoLightBulb />} onClick={showHint}>
            get hint
          </Button>
          <ExploreButton />
          <LichessLink fen={fen}></LichessLink>
        </Wrap>
      </GridItem>
    </ChessGrid>
  );
}
