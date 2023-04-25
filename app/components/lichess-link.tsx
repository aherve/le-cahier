import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { Link } from '@chakra-ui/react';
import { SiLichess } from 'react-icons/si';

export default function LichessLink(
  props:
    | { fen: string }
    | { gameId: string; moveIndex?: number; orientation?: BoardOrientation },
) {
  let link: string;

  if ('fen' in props) {
    link = `https://lichess.org/editor/${props.fen} `;
  } else {
    const orientation = props.orientation ?? 'white';
    link = `https://lichess.org/${props.gameId}/${orientation}#${
      props.moveIndex ?? 0
    }`;
  }

  return (
    <>
      <Link href={link} isExternal>
        <SiLichess />
      </Link>
    </>
  );
}
