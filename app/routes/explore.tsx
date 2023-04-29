import type { Move, Square } from 'chess.js';

import { RepeatIcon } from '@chakra-ui/icons';
import { Button, GridItem, Heading, Wrap } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { VscBook } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';
import Moves from '../components/moves';

import { ChessGrid } from '~/components/chess-grid';
import { TrainButton } from '~/components/train-button';
import { BookPositionSchema } from '~/schemas/position';
import { toSAN } from '~/services/utils';
import { GameContext } from '~/with-game';

export default function Explore() {
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

  return (
    <ChessGrid fen={fen} onPieceDrop={onDrop} orientation={orientation}>
      <GridItem
        gridArea="title"
        alignSelf="center"
        justifySelf="center"
        paddingTop="5"
      >
        <Wrap>
          <VscBook size="40" />
          <Heading size="lg">Browsing moves</Heading>
        </Wrap>
      </GridItem>

      <GridItem gridArea="moves" maxW="300px">
        <Moves
          bookMoves={bookMoves}
          moves={moves}
          onNavigate={onNavigate}
          showBookMoves={true}
          onPlay={makeMove}
          comments={comment}
        ></Moves>
      </GridItem>
      <GridItem gridArea="actions">
        <Wrap align="center" justify="center">
          <Button leftIcon={<RepeatIcon />} onClick={flip}>
            flip board
          </Button>
          <TrainButton />
          <LichessLink fen={fen}></LichessLink>
        </Wrap>
      </GridItem>
    </ChessGrid>
  );
}
