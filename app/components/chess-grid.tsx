import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import { Flex, Grid, GridItem, Show } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';

import { FenEditor } from './fen-editor';

export function ChessGrid(props: {
  children: React.ReactNode;
  fen: string;
  onPieceDrop: (from: Square, to: Square) => boolean;
  orientation: BoardOrientation;
}) {
  const boardContainerRef = useRef<any>();
  const [boardWidthContainer, setBoardWidthContainer] = useState(400);
  const [fixBoardSize, setFixBoardSize] = useState(false);

  useEffect(() => {
    if (fixBoardSize) {
      return;
    }
    setFixBoardSize(true);
    setBoardWidthContainer(
      Math.min(
        boardContainerRef?.current?.clientWidth,
        boardContainerRef?.current?.clientHeight,
      ),
    );
  }, [
    boardContainerRef?.current?.clientWidth,
    boardContainerRef?.current?.clientHeight,
    fixBoardSize,
  ]);

  return (
    <Grid
      templateAreas={`"title title"
        "message message"
        "board moves"
        "fen moves"
        "actions actions"
        `}
      gridTemplateRows="50px 10px 1fr auto auto auto auto"
      gridTemplateColumns="2fr 1fr"
      columnGap="8"
      rowGap="8"
      h="100%"
    >
      {props.children}

      <Show above="sm">
        <GridItem
          marginTop="-20px"
          gridArea="fen"
          alignSelf="start"
          justifySelf="end"
        >
          <FenEditor width={boardWidthContainer} />
        </GridItem>
      </Show>

      <GridItem gridArea="board" ref={boardContainerRef} minW="200px">
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
