import { Button } from '@chakra-ui/react';
import { useContext } from 'react';
import { ImShuffle } from 'react-icons/im';

import { GameContext } from '~/with-game';

export function FlipBoardButton() {
  const { orientation, setOrientation } = useContext(GameContext);

  function flip() {
    setOrientation(orientation === 'white' ? 'black' : 'white');
  }

  return (
    <Button leftIcon={<ImShuffle />} onClick={flip}>
      flip board
    </Button>
  );
}
