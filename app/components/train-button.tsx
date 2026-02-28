import { Button } from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { MdOutlineSmartToy } from 'react-icons/md';

import { GameContext } from '~/with-game';

export function TrainButton(props: { reset?: boolean }) {
  const { reset, fen } = useContext(GameContext);
  const navigate = useNavigate();

  function train() {
    if (props.reset) {
      reset();
      navigate('/train');
    }

    navigate('/train?' + new URLSearchParams({ from: fen }));
  }

  return (
    <Button variant="outline" leftIcon={<MdOutlineSmartToy />} onClick={train}>
      Train {props.reset ? '' : ' from here'}
    </Button>
  );
}
