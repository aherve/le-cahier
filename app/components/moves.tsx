import type { Move } from 'chess.js';

import {
  Dialog,
  Card,
  Text,
  Flex,
  Heading,
  Link,
  Stack,
  Separator,
  Wrap,
  Switch,
  WrapItem,
  useDisclosure,
  Button,
  createToaster,
} from '@chakra-ui/react';
import { Chess } from 'chess.js';
import { chunk } from 'lodash';
import { useContext, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import { PositionComments } from './position-comments';

import { GameContext } from '~/with-game';

const toaster = createToaster({
  placement: 'top',
  duration: 2000,
});

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
      toaster.create({
        title: 'Delete mode',
        description: 'Click on a move to delete it',
        type: 'info',
      });
    }
  }

  return (
    <>
      <Card.Root h="100%">
        <Card.Body>
          <Stack separator={<Separator />} gap="10">
            {props.showBookMoves && (
              <>
                <Wrap justify="space-between">
                  <Heading size="xs">Book moves</Heading>
                  {props.allowDelete && (
                    <WrapItem>
                      <Switch.Root
                        colorPalette="red"
                        checked={showDelete}
                        onCheckedChange={(e) => toggleShowDelete()}
                      >
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Root>
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
              </>
            )}
            <>
              <Heading size="xs">Game moves</Heading>
              <Stack gap="1">
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
              </Stack>
            </>
            {props.showComments && (
              <>
                <PositionComments
                  orientation={orientation}
                  comments={props.comments}
                  key={props.comments}
                  fen={fen}
                />
              </>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>
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
  const { open, onOpen, onClose } = useDisclosure();
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

      <Dialog.Root
        open={open}
        onOpenChange={(e) => (e.open ? onOpen() : onClose())}
        role="alertdialog"
        initialFocusEl={() => cancelRef.current}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header fontSize="lg" fontWeight="bold">
              Delete Move
            </Dialog.Header>

            <Dialog.Body>Confirm move deletion ?</Dialog.Body>

            <Dialog.Footer>
              <Button ref={cancelRef} onClick={onClose}>
                Abort !
              </Button>
              <Button colorScheme="red" onClick={onConfirm} ml={3}>
                Yes, delete move
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
