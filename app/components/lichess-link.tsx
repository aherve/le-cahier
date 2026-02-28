import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { Button, Tooltip } from '@chakra-ui/react';
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
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button variant="outline" asChild fontSize={{ base: "lg", md: "md" }} flexShrink={0}>
          <a href={link} target="_blank" rel="noopener noreferrer">
            <SiLichess />
          </a>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Open in Lichess</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}
