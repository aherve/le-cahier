import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import { Flex, Grid, GridItem } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';

export function ChessGrid(props: {
  children: React.ReactNode;
  fen: string;
  onPieceDrop: (from: Square, to: Square) => boolean;
  orientation: BoardOrientation;
}) {
  const boardRef = useRef<any>();
  const [boardWidthContainer, setBoardWidthContainer] = useState(400);

  useEffect(() => {
    setBoardWidthContainer(
      Math.min(boardRef?.current?.clientWidth, boardRef?.current?.clientHeight),
    );
  }, [boardRef?.current?.clientWidth, boardRef?.current?.clientHeight]);

  return (
    <Grid
      templateAreas={`"title title"
        "message message"
        "board moves"
        "actions actions"
        `}
      gridTemplateRows="50px 10px 1fr auto auto"
      gridTemplateColumns="2fr 1fr"
      columnGap="8"
      rowGap="8"
      h="100%"
    >
      {props.children}

      <GridItem gridArea="board" ref={boardRef} minW="200px">
        <Flex>
          <Chessboard
            position={props.fen}
            onPieceDrop={props.onPieceDrop}
            boardWidth={boardWidthContainer}
            boardOrientation={props.orientation}
          />
        </Flex>
      </GridItem>
    </Grid>
  );
}
