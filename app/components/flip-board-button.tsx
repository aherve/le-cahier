import { Button } from '@chakra-ui/react';
import mixpanel from 'mixpanel-browser';
import { useContext } from 'react';
import { ImShuffle } from 'react-icons/im';

import { GameContext } from '~/with-game';

export function FlipBoardButton() {
  const { orientation, setOrientation } = useContext(GameContext);

  function flip() {
    if (mixpanel.config) {
      mixpanel.track('flip-board');
    }
    setOrientation(orientation === 'white' ? 'black' : 'white');
  }

  return (
    <Button variant="outline" onClick={flip}>
      <ImShuffle />
      flip board
    </Button>
  );
}
