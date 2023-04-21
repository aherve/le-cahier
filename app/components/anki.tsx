import type { TrainMessageInputType } from './train-message';
import type { Square } from 'chess.js';
import type { BookPosition } from '~/schemas/position';

import { Code, Flex, Spinner } from '@chakra-ui/react';
import { useFetcher } from '@remix-run/react';
import { Chess } from 'chess.js';
import { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';

import LichessLink from './lichess-link';
import TrainMessage, { TrainMessageInput } from './train-message';

export default function Anki() {
  const [position, setPosition] = useState<BookPosition | null>(null);
  const [msg, setMsg] = useState<TrainMessageInputType>('empty');
  const fetcher = useFetcher<BookPosition>();

  const fen = position?.fen ?? new Chess().fen();

  async function ankiUpdate(isSuccess: boolean) {
    if (!position) {
      return;
    }
    return fetch('/api/moves/update-anki', {
      method: 'POST',
      body: JSON.stringify({ fen: position.fen, isSuccess }),
    });
  }

  const orientation = new Chess(fen).turn() === 'b' ? 'black' : 'white';
  if (
    position &&
    position.bookMoves &&
    Object.keys(position.bookMoves).length === 0
  ) {
    console.log(
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
    setPosition(fetcher.data);
  }, [fetcher.data]);

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const expectedMoves = Object.keys(position?.bookMoves ?? []);
    const move = `${sourceSquare}${targetSquare}`;

    if (expectedMoves.includes(move)) {
      setMsg(TrainMessageInput.enum.success);
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

  if (fetcher.state === 'loading') {
    return <Spinner />;
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <TrainMessage type={msg} />
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
        </Flex>
        <Code>{fen}</Code>
      </Flex>
    </>
  );
}
