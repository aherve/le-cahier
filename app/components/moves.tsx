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

export default function Moves(props: {
  moves: Array<Move>;
  onNavigate: (move: Move) => void;
  onPlay?: (move: string) => void;
  bookMoves?: Array<string>;
  showBookMoves: boolean;
  comments?: string;
}) {
  const chunks = chunk(props.moves, 2);
  const bookMoves = props.bookMoves ?? [];

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
                      <Link onClick={() => props.onPlay?.(m)} key={m}>
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
                      onNavigate={props.onNavigate}
                      movePair={c}
                      moveIndex={i}
                      key={i}
                    ></MoveItem>
                  );
                })}
              </List>
            </StackItem>
            {props.comments && (
              <StackItem>
                <Flex
                  gap="1"
                  direction="row"
                  justifyContent="space-between"
                  wrap="wrap"
                >
                  {props.comments}
                </Flex>
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
