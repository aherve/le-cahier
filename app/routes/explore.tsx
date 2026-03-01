import type { MetaFunction } from '@remix-run/node';
import type { Square } from 'chess.js';

import { Alert, GridItem, Heading, Link, Wrap } from '@chakra-ui/react';
import { DEFAULT_POSITION } from 'chess.js';
import mixpanel from 'mixpanel-browser';
import { useContext, useEffect, useState } from 'react';
import { VscBook } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';
import Moves from '../components/moves';

import { ChessGrid, useBoardWidth } from '~/components/chess-grid';
import { FlipBoardButton } from '~/components/flip-board-button';
import { RecordButton } from '~/components/record-button';
import { TrainButton } from '~/components/train-button';
import { BookPositionSchema } from '~/schemas/position';
import { toSAN } from '~/services/utils';
import { GameContext } from '~/with-game';

export const meta: MetaFunction = ({ matches }) => {
  const parentMeta = matches.flatMap(match => match.meta ?? []);
  return [
    ...parentMeta.filter(meta => !('title' in meta) && !(('name' in meta) && meta.name === 'description')),
    { title: 'Explore | Le Cahier' },
    { name: 'description', content: 'Browse your repertoire' },
  ];
};

function MovesSection(props: { bookMoves: string[]; comment: string }) {
  const boardWidth = useBoardWidth();
  return (
    <GridItem
      gridArea="moves"
      width={{ base: `${boardWidth}px`, lg: '300px' }}
      justifySelf={{ base: 'center', lg: 'start' }}
    >
      <Moves
        bookMoves={props.bookMoves}
        showBookMoves={true}
        comments={props.comment}
        showComments={true}
      ></Moves>
    </GridItem>
  );
}

export default function Explore() {
  const { fen, turn, makeMove, orientation } = useContext(GameContext);
  const [comment, setComment] = useState<string>('');
  const [bookMoves, setBookMoves] = useState<string[]>([]);
  const [noMoreMoves, setNoMoreMoves] = useState<boolean>(false);

  useEffect(() => {
    if (mixpanel.config) {
      mixpanel.track('Explore');
    }
    fetch(`/api/moves/get?fen=${encodeURIComponent(fen)}`)
      .then((res) => res.json())
      .then((data) => {
        const isPlayerTurn = turn === orientation[0];
        const position = BookPositionSchema.nullable().parse(data);
        const moves = (
          isPlayerTurn
            ? Object.keys(position?.bookMoves ?? {})
            : Object.keys(position?.opponentMoves ?? {})
        ).map((m) => toSAN(fen, m));
        setBookMoves(moves);
        setComment(
          orientation === 'white'
            ? (position?.commentForWhite ?? '')
            : (position?.commentForBlack ?? ''),
        );
        setNoMoreMoves(moves.length === 0);
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
      <GridItem justifySelf="center" alignSelf="center" gridArea="message">
        {noMoreMoves ? (
          <Alert.Root status="info">
            <Alert.Indicator />
            <Alert.Description>
              {fen === DEFAULT_POSITION ? (
                <div>
                  You don&apos;t have any saved move yet.{' '}
                  <Link textDecoration="underline" href="/record">
                    Record moves
                  </Link>{' '}
                  to start building your repertoire!
                </div>
              ) : (
                'no more moves'
              )}
            </Alert.Description>
          </Alert.Root>
        ) : (
          <></>
        )}
      </GridItem>

      <GridItem
        gridArea="title"
        alignSelf="center"
        justifySelf="center"
        paddingTop="5"
      >
        <Wrap align="center" gap="3">
          <VscBook size="40" />
          <Heading size="xl">Browsing moves</Heading>
        </Wrap>
      </GridItem>

      <MovesSection bookMoves={bookMoves} comment={comment} />
      <GridItem gridArea="actions" minWidth={0}>
        <Wrap align="center" justify="center" gap={2} width="100%">
          <FlipBoardButton />
          <TrainButton />
          <RecordButton />
          <LichessLink fen={fen}></LichessLink>
        </Wrap>
      </GridItem>
    </ChessGrid>
  );
}
