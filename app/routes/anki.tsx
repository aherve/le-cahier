import type { TrainMessageInputType } from '../components/train-message';
import type { Square } from 'chess.js';
import type { BookPosition } from '~/schemas/position';

import {
  Button,
  Checkbox,
  Code,
  Flex,
  Heading,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useFetcher, useNavigate } from '@remix-run/react';
import { Chess } from 'chess.js';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { GiFalling } from 'react-icons/gi';
import { VscBook } from 'react-icons/vsc';

import LichessLink from '../components/lichess-link';
import TrainMessage, { TrainMessageInput } from '../components/train-message';

import { GameContext } from '~/with-game';

export default function Anki() {
  const navigate = useNavigate();
  const { fen, turn, makeMove, reset, orientation, setOrientation } =
    useContext(GameContext);
  const [position, setPosition] = useState<BookPosition | null>(null);
  const [msg, setMsg] = useState<TrainMessageInputType>('empty');
  const [hints, setHints] = useState<string[]>([]);
  const fetcher = useFetcher<BookPosition>();
  const [includeNovelties, setIncludeNovelties] = useState(false);

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

  setOrientation(turn === 'b' ? 'black' : 'white');

  if (
    position &&
    position.bookMoves &&
    Object.keys(position.bookMoves).length === 0
  ) {
    console.error(
      'no book move available. Flagging success and getting next position',
    );
    ankiUpdate(true).then(() => {
      fetcher.load(`/api/moves/get-anki?skipNovelties=${!includeNovelties}`);
    });
  }

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data == null) {
      fetcher.load(`/api/moves/get-anki?skipNovelties=${!includeNovelties}`);
    }
  }, [fetcher, includeNovelties]);

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }
    reset(fetcher.data.fen);
    setPosition(fetcher.data);
  }, [fetcher.data, reset]);

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
      makeMove(move);
      setMsg(TrainMessageInput.enum.yourTurn);
      ankiUpdate(true).then(() => {
        fetcher.load(`/api/moves/get-anki?skipNovelties=${!includeNovelties}`);
      });
      return true;
    } else {
      setMsg(TrainMessageInput.enum.nope);
      ankiUpdate(false);
      return false;
    }
  }

  function Context() {
    const score = position?.ankiScore ?? null;
    if (score === null) {
      return <></>;
    }

    if (score > 0) {
      return <Text> Let's review this position again !</Text>;
    }
    if (score < 0) {
      return (
        <Text>
          You failed to find this move last time. Can you find it now ?
        </Text>
      );
    }
    return (
      <Text>This is a book position you didn't yet trained on or played</Text>
    );
  }

  function toggleNovelties(evt: any) {
    const newValue = evt.target.checked;
    setIncludeNovelties(newValue);
    fetcher.load(`/api/moves/get-anki?skipNovelties=${!newValue}`);
  }

  function explore() {
    navigate('/explore');
  }

  return (
    <>
      <Flex direction="column" align="center" gap="5">
        <Flex direction="row" align="center" gap="5">
          <GiFalling size="40" />
          <Heading size="lg">Reviewing failed moves</Heading>
        </Flex>
        <Checkbox isChecked={includeNovelties} onChange={toggleNovelties}>
          Include novelties
        </Checkbox>
        <TrainMessage type={msg} hints={hints} />
        <Context />
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
          <Button onClick={explore} variant="link">
            <VscBook />
          </Button>
          <LichessLink fen={fen}></LichessLink>
          <Button onClick={showHint}>get hint</Button>
        </Flex>
        <Code>{fen}</Code>
      </Flex>
    </>
  );
}
