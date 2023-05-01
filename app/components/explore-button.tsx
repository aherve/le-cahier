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
      <Button leftIcon={<VscBook />} onClick={explore}>
        Explore
      </Button>
    );
  } else {
    return (
      <Tooltip label="browse in repertoire">
        <Button onClick={explore} variant="link">
          <VscBook />
        </Button>
      </Tooltip>
    );
  }
}
