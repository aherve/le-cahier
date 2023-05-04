import type { Move } from 'chess.js';
import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Button,
  GridItem,
  Heading,
  Spinner,
  Textarea,
  useDisclosure,
  useToast,
  Wrap,
} from '@chakra-ui/react';
import { Chess } from 'chess.js';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BiCloudUpload } from 'react-icons/bi';
import { BsRecordCircle } from 'react-icons/bs';
import { MdYoutubeSearchedFor } from 'react-icons/md';

import Moves from '../components/moves';

import { ChessGrid } from '~/components/chess-grid';
import { ExploreButton } from '~/components/explore-button';
import { FlipBoardButton } from '~/components/flip-board-button';
import { SaveMoveInputSchema } from '~/routes/api/moves/create';
import { BookPositionSchema } from '~/schemas/position';
import { toSAN } from '~/services/utils';
import { GameContext } from '~/with-game';

export default function Record() {
  const { fen, turn, makeMove, orientation } = useContext(GameContext);
  const [bookMoves, setBookMoves] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const toast = useToast();
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
        toast({
          title: 'Move deleted',
          description: 'Successfully deleted move',
          status: 'success',
          duration: 1000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error deleting move',
          description: 'Failed to delete move',
          status: 'error',
          duration: 1000,
          isClosable: true,
        });
      }
    });
  }

  const onScan = useCallback(async () => {
    toast({
      title: 'Scanning',
      description: 'Searching for transpositions. This might take some time...',
      duration: 5000,
      isClosable: true,
      status: 'info',
    });
    const scanRes = await fetch('/api/link-graph', { method: 'POST' }).then(
      (r) => r.json(),
    );
    toast({
      title: 'Scan complete',
      duration: 5000,
      isClosable: true,
      status: 'success',
      description: `found ${scanRes.newTransposition} new transpositions amongts ${scanRes.positionScanned} moves`,
    });
  }, [toast]);

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

      <GridItem
        gridArea="message"
        alignSelf="center"
        justifySelf="center"
      ></GridItem>

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pgn, setPgn] = useState('');
  const cancelRef = useRef();
  const toast = useToast();
  const onConfirm = () => {
    console.log('submitting', pgn);
    setIsLoading(true);
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
        toast({
          title: 'PGN loaded',
          description: `Successfully saved moves from PGN for ${props.orientation}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
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

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef as any}
        onClose={cancel}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Load PGN file for {props.orientation}
            </AlertDialogHeader>

            <AlertDialogBody>
              {isLoading && <Spinner />}
              {!isLoading && (
                <Textarea value={pgn} onChange={onChange}></Textarea>
              )}
              {error && <Alert status="error">{error}</Alert>}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef as any} onClick={cancel}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={onConfirm} ml={3}>
                Upload & save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <ExploreButton />
    </>
  );
}
function FindTranspositionsButton(props: { onScan: () => void }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const onConfirm = () => {
    props.onScan();
    onClose();
  };

  return (
    <>
      <Button leftIcon={<MdYoutubeSearchedFor />} onClick={onOpen}>
        Find transpositions
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef as any}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Find transpositions
            </AlertDialogHeader>

            <AlertDialogBody>
              This is an expensive operation that will scan the entire db.
              Please don't spam it &hearts;
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef as any} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={onConfirm} ml={3}>
                Scan
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
