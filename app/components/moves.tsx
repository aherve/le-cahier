import type { Move } from 'chess.js';

import {
  Card,
  CardBody,
  Text,
  Flex,
  List,
  Heading,
  Link,
  Stack,
  StackDivider,
  StackItem,
} from '@chakra-ui/react';
import { chunk } from 'lodash';
import { useContext } from 'react';

import { PositionComments } from './position-comments';

import { GameContext } from '~/with-game';

export default function Moves(props: {
  bookMoves?: Array<string>;
  showBookMoves: boolean;
  comments?: string;
  showComments: boolean;
}) {
  const bookMoves = props.bookMoves ?? [];
  const { orientation, moves, backTo, makeMove, fen } = useContext(GameContext);
  const chunks = chunk(moves, 2);

  function onNavigate(m: Move) {
    backTo(m.after);
  }

  function onPlay(m: string) {
    makeMove(m);
  }

  return (
    <>
      <Card h="100%">
        <CardBody>
          <Stack divider={<StackDivider />} spacing="10">
            {props.showBookMoves && (
              <StackItem>
                <Heading size="xs">Book moves</Heading>

                <Flex
                  gap="1"
                  direction="row"
                  justifyContent="space-between"
                  wrap="wrap"
                >
                  {bookMoves.map((m) => {
                    return (
                      <Link onClick={() => onPlay(m)} key={m}>
                        {m}
                      </Link>
                    );
                  })}
                </Flex>
              </StackItem>
            )}
            <StackItem>
              <Heading size="xs">Game moves</Heading>
              <List>
                {chunks.map((c, i) => {
                  return (
                    <MoveItem
                      onNavigate={onNavigate}
                      movePair={c}
                      moveIndex={i}
                      key={i}
                    ></MoveItem>
                  );
                })}
              </List>
            </StackItem>
            {props.showComments && (
              <StackItem>
                <PositionComments
                  orientation={orientation}
                  comments={props.comments}
                  key={props.comments}
                  fen={fen}
                />
              </StackItem>
            )}
          </Stack>
        </CardBody>
      </Card>
    </>
  );
}

function MoveItem(props: {
  movePair: Move[];
  moveIndex: number;
  onNavigate: (m: Move) => void;
}) {
  return (
    <>
      <Flex direction="row" alignContent="start" justifyContent="space-between">
        <Text as="b" flex="1 1 0">
          {props.moveIndex + 1}.
        </Text>
        <Link flex="2 1 0" onClick={() => props.onNavigate(props.movePair[0])}>
          {props.movePair[0].san}
        </Link>
        <Link flex="2 1 0" onClick={() => props.onNavigate(props.movePair[1])}>
          {props.movePair[1]?.san ?? ''}
        </Link>
      </Flex>
    </>
  );
}
