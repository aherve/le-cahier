import { Button } from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { BsRecordCircle } from 'react-icons/bs';

import { GameContext } from '~/with-game';

export function RecordButton(props: { reset?: boolean }) {
  const navigate = useNavigate();
  const { reset } = useContext(GameContext);

  function record() {
    if (props.reset) {
      reset();
    }
    navigate('/record');
  }
  return (
    <Button variant="outline" onClick={record} fontSize="md" flexShrink={0}>
      <BsRecordCircle />
      {props.reset ? 'Record moves' : 'update repertoire'}
    </Button>
  );
}
