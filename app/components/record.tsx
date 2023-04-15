import type { Move } from 'chess.js';
import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import { RepeatIcon } from '@chakra-ui/icons';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { MdYoutubeSearchedFor } from 'react-icons/md';

import Moves from './moves';

import { SaveMoveInputSchema } from '~/routes/api/moves/create';
import { BookPositionSchema } from '~/schemas/position';
import { GameService } from '~/services/gameService';
import { toSAN } from '~/services/utils';

export function Record() {
  const [bookMoves, setBookMoves] = useState<string[]>([]);
  const [fen, setFen] = useState(GameService.fen);
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const toast = useToast();

  const moves = GameService.moves;

  useEffect(() => {
    fetch(`/api/moves/get?fen=${encodeURIComponent(fen)}`)
      .then((res) => res.json())
      .then((data) => {
        const isPlayerTurn = GameService.turn === orientation[0];
        const position = BookPositionSchema.nullable().parse(data);
        setBookMoves(
          (isPlayerTurn
            ? Object.keys(position?.bookMoves ?? {})
            : Object.keys(position?.opponentMoves ?? {})
          ).map((m) => toSAN(fen, m))
        );
      });
  }, [fen, orientation]);

  async function makeMove(move: string | { from: Square; to: Square }) {
    try {
      const validMove = GameService.makeMove(move);

      const wasOpponentMove =
        (validMove.color === 'b' && orientation === 'white') ||
        (validMove.color === 'w' && orientation === 'black');

      setFen(GameService.fen);
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
    return makeMove({ from: sourceSquare, to: targetSquare }) !== null;
  }

  function flip() {
    setOrientation((o) => (o === 'white' ? 'black' : 'white'));
  }

  function onNavigate(move: Move) {
    GameService.backTo(move);
    setFen(GameService.fen);
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
      (r) => r.json()
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
    <>
      <Flex direction="row" gap="20">
        <Flex direction="column" align="center" gap="10">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={orientation}
          />
          <Flex direction="row" align="center" gap="5">
            <Button leftIcon={<RepeatIcon />} onClick={flip}>
              flip board
            </Button>
            {FindTranspositionsButton({ onScan })}
          </Flex>
        </Flex>
        <Moves
          bookMoves={bookMoves}
          showBookMoves={true}
          moves={moves}
          onNavigate={onNavigate}
          onPlay={makeMove}
        ></Moves>
      </Flex>
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
