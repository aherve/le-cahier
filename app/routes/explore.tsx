import type { MetaFunction } from '@remix-run/node';
import type { Square } from 'chess.js';

import { GridItem, Heading, Wrap } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { VscBook } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';
import Moves from '../components/moves';

import { ChessGrid } from '~/components/chess-grid';
import { FlipBoardButton } from '~/components/flip-board-button';
import { RecordButton } from '~/components/record-button';
import { TrainButton } from '~/components/train-button';
import { BookPositionSchema } from '~/schemas/position';
import { toSAN } from '~/services/utils';
import { GameContext } from '~/with-game';

export const meta: MetaFunction = () => {
  return {
    title: 'Explore | Le Cahier',
    description: 'Browse your repertoire',
  };
};

export default function Explore() {
  const { fen, turn, makeMove, orientation } = useContext(GameContext);
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
        setComment(
          orientation === 'white'
            ? position?.commentForWhite ?? ''
            : position?.commentForBlack ?? '',
        );
      });
  }, [fen, orientation, turn]);

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
          showBookMoves={true}
          comments={comment}
          showComments={true}
        ></Moves>
      </GridItem>
      <GridItem gridArea="actions">
        <Wrap align="center" justify="center">
          <FlipBoardButton />
          <TrainButton />
          <RecordButton />
          <LichessLink fen={fen}></LichessLink>
        </Wrap>
      </GridItem>
    </ChessGrid>
  );
}
