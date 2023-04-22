import type { TrainMessageInputType } from './train-message';
import type { Square } from 'chess.js';
import type { BookPosition } from '~/schemas/position';

import { Box, Button, Code, Flex, Spinner } from '@chakra-ui/react';
import { useFetcher } from '@remix-run/react';
import { Chess } from 'chess.js';
import { useCallback, useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';

import LichessLink from './lichess-link';
import TrainMessage, { TrainMessageInput } from './train-message';

import { GameService } from '~/services/gameService';

export default function Anki() {
  const [position, setPosition] = useState<BookPosition | null>(null);
  const [msg, setMsg] = useState<TrainMessageInputType>('empty');
  const [hints, setHints] = useState<string[]>([]);
  const fetcher = useFetcher<BookPosition>();

  const ankiUpdate = useCallback(
    async (isSuccess: boolean) => {
      if (!position?.fen) {
        return;
      }
      return fetch('/api/moves/update-anki', {
        method: 'POST',
        body: JSON.stringify({ fen: position.fen, isSuccess }),
      }).then(() => console.log('anki updated'));
    },
    [position?.fen],
  );

  const orientation = GameService.turn === 'b' ? 'black' : 'white';
  const fen = GameService.fen;

  if (
    position &&
    position.bookMoves &&
    Object.keys(position.bookMoves).length === 0
  ) {
    console.error(
      'no book move available. Flagging success and getting next position',
    );
    ankiUpdate(true).then(() => {
      fetcher.load('/api/moves/get-anki');
    });
  }

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load('/api/moves/get-anki');
    }
  }, [fetcher]);

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }
    GameService.reset(fetcher.data.fen);
    setPosition(fetcher.data);
  }, [fetcher.data]);

  function showHint() {
    const hints = Object.keys(position?.bookMoves ?? [])
      .map((m) => {
        try {
          const g = new Chess(fen);
          const move = g.move(m);
          return move.san;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    setHints(hints);
    setMsg(TrainMessageInput.enum.hint);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const expectedMoves = Object.keys(position?.bookMoves ?? []);
    const move = `${sourceSquare}${targetSquare}`;

    if (expectedMoves.includes(move)) {
      GameService.makeMove(move);
      setMsg(TrainMessageInput.enum.yourTurn);
      ankiUpdate(true).then(() => {
        fetcher.load('/api/moves/get-anki');
      });
      return true;
    } else {
      setMsg(TrainMessageInput.enum.nope);
      ankiUpdate(false);
      return false;
    }
  }

  return (
    <>
      {(position?.ankiScore ?? -1) > 0 && (
        <Box>Let's review this position again !</Box>
      )}
      {(position?.ankiScore ?? 1) < 0 && (
        <Box>You failed to find this move last time. Can you find it now ?</Box>
      )}
      {(position?.ankiScore ?? -1) === 0 && (
        <Box>This is a book position you didn't yet trained on or played</Box>
      )}
      <Flex direction="column" align="center" gap="5">
        <TrainMessage type={msg} hints={hints} />
        {fetcher.state === 'loading' && <Spinner />}
        <Flex direction="row" gap="20">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={400}
            boardOrientation={orientation}
          />
        </Flex>
        <Flex direction="row" gap="5" align="center">
          <LichessLink fen={fen}></LichessLink>
          <Button onClick={showHint}>get hint</Button>
        </Flex>
        <Code>{fen}</Code>
      </Flex>
    </>
  );
}
