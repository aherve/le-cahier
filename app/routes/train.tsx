import type { TrainMessageInputType } from '../components/train-message';
import type { Move } from 'chess.js';
import type { Square } from 'react-chessboard/dist/chessboard/types';
import type { GetChallengeOutput } from '~/routes/api/moves/challenge';

import { EditIcon, RepeatIcon } from '@chakra-ui/icons';
import { Button, Flex, GridItem, Heading, Wrap } from '@chakra-ui/react';
import { useFetcher, useNavigate, useSearchParams } from '@remix-run/react';
import { Chess } from 'chess.js';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { MdOutlineSmartToy } from 'react-icons/md';

import LichessLink from '../components/lichess-link';
import Moves from '../components/moves';
import TrainMessage, { TrainMessageInput } from '../components/train-message';

import { ChessGrid } from '~/components/chess-grid';
import { GetChallengeOutputSchema } from '~/routes/api/moves/challenge';
import { GameContext } from '~/with-game';

export default function Train() {
  const {
    fen,
    moves,
    turn,
    backTo,
    makeMove,
    isValidMove,
    orientation,
    setOrientation,
    reset,
  } = useContext(GameContext);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const startingFEN = params.get('from');
  const [msg, setMsg] = useState<TrainMessageInputType>('empty');
  const [challenge, setChallenge] = useState<GetChallengeOutput | null>(null);

  const boardRef = useRef<any>();
  const [boardWidthContainer, setBoardWidthContainer] = useState(400);

  useEffect(() => {
    setBoardWidthContainer(
      Math.min(boardRef?.current?.clientWidth, boardRef?.current?.clientHeight),
    );
  }, [boardRef?.current?.clientWidth, boardRef?.current?.clientHeight]);

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
    if (!isPlayerTurn && fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/api/moves/challenge?fen=${encodeURIComponent(fen)}`);
    }

    if (!isPlayerTurn && fetcher.state === 'idle' && fetcher.data) {
      const data = GetChallengeOutputSchema.parse(fetcher.data);
      if (!data.challengeMove) {
        setMsg(TrainMessageInput.enum.noMoreData);
      } else {
        makeMove(data.challengeMove);
        fetcher.data = null;
        setChallenge(data);
        setMsg(TrainMessageInput.enum.yourTurn);
      }
    }
  }, [fen, fetcher, orientation, turn, isPlayerTurn, makeMove]);

  function onNavigate(move: Move) {
    backTo(move.after);
    fetcher.data = null;
    setChallenge(null);
  }

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
      ankiUpdate(false);
      setMsg(TrainMessageInput.enum.nope);
      return false;
    }
  }

  function again() {
    if (startingFEN) {
      backTo(startingFEN);
    } else {
      reset();
    }
    fetcher.data = null;
    setChallenge(null);
  }

  function showHint() {
    if (hints.length === 0) {
      return;
    }
    setMsg(TrainMessageInput.enum.hint);
  }

  function flip() {
    setOrientation(orientation === 'white' ? 'black' : 'white');
  }

  function recordFromHere() {
    navigate('/record');
  }

  return (
    <ChessGrid>
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

      <GridItem gridArea="board" ref={boardRef} minW="200px">
        <Flex>
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={boardWidthContainer}
            boardOrientation={orientation}
          />
        </Flex>
      </GridItem>

      <GridItem gridArea="moves" maxW="300px">
        <Moves
          showBookMoves={false}
          moves={moves}
          onNavigate={onNavigate}
        ></Moves>
      </GridItem>

      <GridItem gridArea="actions">
        <Wrap align="center" justify="center">
          <Button leftIcon={<RepeatIcon />} onClick={flip}>
            flip board
          </Button>
          <Button leftIcon={<EditIcon />} onClick={recordFromHere}>
            Record more moves
          </Button>
          <Button leftIcon={<RepeatIcon />} onClick={again}>
            Again
          </Button>
          <Button onClick={showHint}>get hint</Button>
          <LichessLink fen={fen}></LichessLink>
        </Wrap>
      </GridItem>
    </ChessGrid>
  );
}
