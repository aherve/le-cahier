import { Input } from '@chakra-ui/react';
import { validateFen } from 'chess.js';
import { useContext, useEffect, useState } from 'react';

import { GameContext } from '~/with-game';

export function FenEditor(props: { width: number }) {
  const { fen, reset } = useContext(GameContext);

  const [formFEN, setFormFEN] = useState(fen);

  useEffect(() => {
    setFormFEN(fen);
  }, [fen]);

  function submit() {
    const valid = validateFen(formFEN);
    if (valid.ok) {
      reset(formFEN);
    } else {
      setFormFEN(fen);
    }
  }

  return (
    <>
      <Input
        onFocus={(event) => event.target.select()}
        onChange={(event) => setFormFEN(event.target.value)}
        width={props.width}
        value={formFEN}
        onBlur={submit}
      />
    </>
  );
}
