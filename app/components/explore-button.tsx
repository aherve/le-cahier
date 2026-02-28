import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import { Button, Tooltip } from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { VscBook } from 'react-icons/vsc';

import { GameContext } from '~/with-game';

export function ExploreButton(props: {
  reset?: boolean;
  fen?: string;
  orientation?: BoardOrientation;
  variant?: 'button' | 'icon';
}) {
  const { reset, setOrientation } = useContext(GameContext);
  const navigate = useNavigate();
  const variant = props.variant ?? 'button';

  function explore() {
    if (props.reset) {
      reset();
    }
    if (props.fen) {
      reset(props.fen);
    }
    if (props.orientation) {
      setOrientation(props.orientation);
    }
    navigate('/explore');
  }

  if (variant === 'button') {
    return (
      <Button variant="outline" onClick={explore} flexShrink={0}>
        <VscBook />
        Explore
      </Button>
    );
  } else {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button onClick={explore} variant="plain" flexShrink={0}>
            <VscBook />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>browse in repertoire</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    );
  }
}
