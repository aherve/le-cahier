import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { Link, Tooltip } from '@chakra-ui/react';
import { useContext } from 'react';
import { SiLichess } from 'react-icons/si';

import { GameContext } from '~/with-game';

export default function LichessLink(
  props: { orientation?: BoardOrientation } & (
    | { fen: string }
    | { gameId: string; moveIndex?: number }
  ),
) {
  let link: string;
  const ctx = useContext(GameContext);
  const orientation = props.orientation ?? ctx.orientation;

  if ('fen' in props) {
    link = `https://lichess.org/analysis/${encodeURI(
      props.fen,
    )}?color=${orientation}`;
  } else {
    link = `https://lichess.org/${props.gameId}/${orientation}#${
      props.moveIndex ?? 0
    }`;
  }

  return (
    <>
      <Tooltip label="Open in Lichess">
        <Link href={link} isExternal>
          <SiLichess />
        </Link>
      </Tooltip>
    </>
  );
}
