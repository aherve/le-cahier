import type { Move } from 'chess.js';

import {
  AlertDialog,
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
  Wrap,
  Switch,
  WrapItem,
  useToast,
  useDisclosure,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
} from '@chakra-ui/react';
import { Chess } from 'chess.js';
import { chunk } from 'lodash';
import { useContext, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import { PositionComments } from './position-comments';

import { GameContext } from '~/with-game';

export default function Moves(props: {
  allowDelete?: boolean;
  bookMoves?: Array<string>;
  comments?: string;
  onDelete?: (m: Move) => void;
  showBookMoves: boolean;
  showComments: boolean;
}) {
  const bookMoves = props.bookMoves ?? [];
  const { orientation, moves, backTo, makeMove, fen } = useContext(GameContext);
  const chunks = chunk(moves, 2);
  const [showDelete, setShowDelete] = useState(false);
  const toast = useToast();

  function onNavigate(m: Move) {
    backTo(m.after);
  }

  function deleteMove(san: string) {
    const g = new Chess(fen);
    const move = g.move(san);
    props.onDelete?.(move);
  }

  function toggleShowDelete() {
    setShowDelete((previous) => !previous);
    if (!showDelete) {
      toast({
        title: 'Delete mode',
        description: 'Click on a move to delete it',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  }

  return (
    <>
      <Card h="100%">
        <CardBody>
          <Stack divider={<StackDivider />} spacing="10">
            {props.showBookMoves && (
              <StackItem>
                <Wrap justify="space-between">
                  <Heading size="xs">Book moves</Heading>
                  {props.allowDelete && (
                    <WrapItem>
                      <Switch
                        colorScheme="red"
                        isChecked={showDelete}
                        onChange={toggleShowDelete}
                      ></Switch>
                      <FaTrash color={'gray.500'} />
                    </WrapItem>
                  )}
                </Wrap>

                <Wrap>
                  {bookMoves.map((m) => {
                    if (showDelete) {
                      return (
                        <DeleteWithConfirm
                          key={m}
                          text={m}
                          onConfirm={() => deleteMove(m)}
                        />
                      );
                    } else {
                      return (
                        <Link onClick={() => makeMove(m)} key={m}>
                          {m}
                        </Link>
                      );
                    }
                  })}
                </Wrap>
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

function DeleteWithConfirm(props: { text: string; onConfirm: () => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<any>();

  function onConfirm() {
    props.onConfirm();
    onClose();
  }

  return (
    <>
      <Link onClick={onOpen} color={'red'}>
        {props.text}
      </Link>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Move
            </AlertDialogHeader>

            <AlertDialogBody>Confirm move deletion ?</AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Abort !
              </Button>
              <Button colorScheme="red" onClick={onConfirm} ml={3}>
                Yes, delete move
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
