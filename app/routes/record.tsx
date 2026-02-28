import type { MetaFunction } from '@remix-run/node';
import type { Move } from 'chess.js';
import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import {
  Alert,
  Dialog,
  Box,
  Button,
  GridItem,
  Heading,
  Spinner,
  Textarea,
  useDisclosure,
  Wrap,
  createToaster,
} from '@chakra-ui/react';
import { Chess } from 'chess.js';
import mixpanel from 'mixpanel-browser';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BiCloudUpload } from 'react-icons/bi';
import { BsRecordCircle } from 'react-icons/bs';
import { MdYoutubeSearchedFor } from 'react-icons/md';

import Moves from '../components/moves';

import { ChessGrid } from '~/components/chess-grid';
import { ExploreButton } from '~/components/explore-button';
import { FlipBoardButton } from '~/components/flip-board-button';
import { SaveMoveInputSchema } from '~/routes/api.moves.create';
import { BookPositionSchema } from '~/schemas/position';
import { toSAN } from '~/services/utils';
import { GameContext } from '~/with-game';

const enableFindTranspositions = true; // todo: scale function

const toaster = createToaster({
  placement: 'top',
  duration: 5000,
});

export const meta: MetaFunction = () => {
  return [
    { title: 'Update Repertoire | Le Cahier' },
    { name: 'description', content: 'Update your repertoire' },
  ];
};

export default function Record() {
  const { fen, turn, makeMove, orientation } = useContext(GameContext);
  const [bookMoves, setBookMoves] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [lastDelete, setLastDelete] = useState(Date.now());

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
  }, [fen, orientation, turn, lastDelete]);

  async function LocalMakeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = makeMove(move);

      const wasOpponentMove =
        (validMove.color === 'b' && orientation === 'white') ||
        (validMove.color === 'w' && orientation === 'black');

      const payload = SaveMoveInputSchema.parse({
        isOpponentMove: wasOpponentMove,
        fen,
        move: `${validMove.from}${validMove.to}`,
      });
      console.log('recording move', payload);
      if (mixpanel.config) {
        mixpanel.track('record-move');
      }
      await fetch('api/moves/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return validMove;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return LocalMakeMove({ from: sourceSquare, to: targetSquare }) !== null;
  }

  function deleteMove(move: Move) {
    const turnBefore = new Chess(move.before).turn();
    const isOpponentMove =
      (orientation === 'white' && turnBefore === 'b') ||
      (orientation === 'black' && turnBefore === 'w');
    fetch('api/moves/delete', {
      method: 'POST',
      body: JSON.stringify({
        fen,
        move,
        isOpponentMove,
      }),
    }).then((r) => {
      setLastDelete(Date.now());
      if (r.ok) {
        toaster.create({
          title: 'Move deleted',
          description: 'Successfully deleted move',
          type: 'success',
        });
      } else {
        toaster.create({
          title: 'Error deleting move',
          description: 'Failed to delete move',
          type: 'error',
        });
      }
    });
  }

  const onScan = useCallback(async () => {
    if (mixpanel.config) {
      mixpanel.track('find transpositions');
    }
    toaster.create({
      title: 'Scanning',
      description: 'Searching for transpositions. This might take some time...',
      type: 'info',
    });
    const scanRes = await fetch('/api/link-graph', { method: 'POST' }).then(
      (r) => r.json(),
    );
    toaster.create({
      title: 'Scan complete',
      type: 'success',
      description: `found ${scanRes.newTransposition} new transpositions amongts ${scanRes.positionScanned} moves`,
    });
  }, []);

  return (
    <ChessGrid fen={fen} onPieceDrop={onDrop} orientation={orientation}>
      <GridItem
        gridArea="title"
        alignSelf="center"
        justifySelf="center"
        paddingTop="5"
      >
        <Wrap>
          <BsRecordCircle color="red" size="40" />
          <Heading size="lg">Recording moves</Heading>
        </Wrap>
      </GridItem>

      <GridItem gridArea="message" alignSelf="center" justifySelf="center">
        <Box>
          Move pieces or upload a PGN to update your repertoire for{' '}
          {orientation} (flip board to switch color)
        </Box>
      </GridItem>

      <GridItem gridArea="moves" maxW="300px">
        <Moves
          comments={comment}
          bookMoves={bookMoves}
          showBookMoves={true}
          showComments={true}
          allowDelete={true}
          onDelete={deleteMove}
        ></Moves>
      </GridItem>

      <GridItem gridArea="actions">
        <Wrap align="center" justify="center">
          <FlipBoardButton />
          {FindTranspositionsButton({ onScan })}
          {LoadPGNButton({ orientation })}
        </Wrap>
      </GridItem>
    </ChessGrid>
  );
}

function LoadPGNButton(props: { orientation: BoardOrientation }) {
  const { open, onOpen, onClose } = useDisclosure();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pgn, setPgn] = useState('');
  const cancelRef = useRef();
  const onConfirm = () => {
    console.log('submitting', pgn);
    setIsLoading(true);
    if (mixpanel.config) {
      mixpanel.track('load pgn');
    }
    fetch('api/moves/create-from-pgn', {
      method: 'POST',
      body: JSON.stringify({
        pgn,
        orientation: props.orientation,
      }),
    }).then((resp) => {
      if (resp.ok) {
        setPgn('');
        setError(null);
        onClose();
        toaster.create({
          title: 'PGN loaded',
          description: `Successfully saved moves from PGN for ${props.orientation}`,
          type: 'success',
        });
      } else {
        resp.json().then((t) => setError(`Error: ${t['error']}`));
      }
      setIsLoading(false);
    });
  };

  // listen to text area changes
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setPgn(e.target.value);
  }

  function cancel() {
    setError(null);
    setPgn('');
    onClose();
  }

  return (
    <>
      <Button leftIcon={<BiCloudUpload />} onClick={onOpen}>
        Upload PGN
      </Button>

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
              Load PGN file for {props.orientation}
            </Dialog.Header>

            <Dialog.Body>
              {isLoading && <Spinner />}
              {!isLoading && (
                <Textarea value={pgn} onChange={onChange}></Textarea>
              )}
              {error && <Alert.Root status="error"><Alert.Description>{error}</Alert.Description></Alert.Root>}
            </Dialog.Body>

            <Dialog.Footer>
              <Button ref={cancelRef as any} onClick={cancel}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={onConfirm} ml={3}>
                Upload & save
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
      <ExploreButton />
    </>
  );
}
function FindTranspositionsButton(props: { onScan: () => void }) {
  const { open, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const onConfirm = () => {
    props.onScan();
    onClose();
  };

  if (!enableFindTranspositions) {
    return <></>;
  }
  return (
    <>
      <Button leftIcon={<MdYoutubeSearchedFor />} onClick={onOpen}>
        Find transpositions
      </Button>

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
              Find transpositions
            </Dialog.Header>

            <Dialog.Body>
              This is an expensive operation that will scan the entire db.
              Please don't spam it &hearts;
            </Dialog.Body>

            <Dialog.Footer>
              <Button ref={cancelRef as any} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={onConfirm} ml={3}>
                Scan
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
