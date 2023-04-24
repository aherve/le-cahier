import type { Move, Square } from 'chess.js';

import { RepeatIcon } from '@chakra-ui/icons';
import { Box, Button, Code, Flex, Heading, Spacer } from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext, useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { VscBook } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';
import Moves from '../components/moves';

import { BookPositionSchema } from '~/schemas/position';
import { toSAN } from '~/services/utils';
import { GameContext } from '~/with-game';

export default function Explore() {
  const navigate = useNavigate();
  const { fen, moves, turn, backTo, makeMove, orientation, setOrientation } =
    useContext(GameContext);
  const [comment, setComment] = useState<string>('');
  const [bookMoves, setBookMoves] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/moves/get?fen=${encodeURIComponent(fen)}`)
      .then((res) => res.json())
      .then((data) => {
        const isPlayerTurn = turn === orientation[0];
        const position = BookPositionSchema.nullable().parse(data);
        setBookMoves(
          (isPlayerTurn
            ? Object.keys(position?.bookMoves ?? {})
            : Object.keys(position?.opponentMoves ?? {})
          ).map((m) => toSAN(fen, m)),
        );
        if (isPlayerTurn) {
          setComment(position?.commentForPlayer ?? '');
        } else {
          setComment(position?.commentForOpponent ?? '');
        }
      });
  }, [fen, orientation, turn]);

  function flip() {
    setOrientation(orientation === 'white' ? 'black' : 'white');
  }

  function onNavigate(move: Move) {
    backTo(move.after);
  }

  function onDrop(from: Square, to: Square) {
    try {
      makeMove({ from, to });
      return true;
    } catch {
      return false;
    }
  }

  function startTraining() {
    navigate('/train?' + new URLSearchParams({ from: fen }));
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <Flex direction="row" align="center" gap="5">
          <VscBook size="40" />
          <Heading size="lg">Browsing moves</Heading>
        </Flex>
        <Flex
          direction="column"
          align="center"
          justify="space-between"
          gap="10"
          grow="1"
        >
          <Flex direction="row" gap="20">
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardWidth={400}
              boardOrientation={orientation}
            />
            <Moves
              bookMoves={bookMoves}
              moves={moves}
              onNavigate={onNavigate}
              showBookMoves={true}
              onPlay={makeMove}
            ></Moves>
          </Flex>
          <Box>{comment}</Box>
          <Flex direction="row" gap="5" align="center">
            <Button leftIcon={<RepeatIcon />} onClick={flip}>
              flip board
            </Button>
            <Button onClick={startTraining}>Train from this position</Button>
            <LichessLink fen={fen}></LichessLink>
          </Flex>
        </Flex>
        <Spacer />
        <Code>{fen}</Code>
      </Flex>
    </>
  );
}
