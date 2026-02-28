import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import { Box, Grid, GridItem } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';

import { FenEditor } from './fen-editor';

const MAX_BOARD_WIDTH = 550;
const SIDEBAR_WIDTH = '400px';
const CONTAINER_MAX_WIDTH = '1200px';

export function ChessGrid(props: {
  children: React.ReactNode;
  fen: string;
  onPieceDrop: (from: Square, to: Square) => boolean;
  orientation: BoardOrientation;
}) {
  const boardContainerRef = useRef<any>();
  const [boardWidth, setBoardWidth] = useState(400);

  useEffect(() => {
    const updateBoardWidth = () => {
      if (boardContainerRef.current) {
        const width = Math.min(
          boardContainerRef.current.clientWidth,
          boardContainerRef.current.clientHeight,
          MAX_BOARD_WIDTH
        );
        setBoardWidth(width);
      }
    };

    updateBoardWidth();
    window.addEventListener('resize', updateBoardWidth);
    return () => window.removeEventListener('resize', updateBoardWidth);
  }, []);

  return (
    <Grid
      templateAreas={`"title title"
        "message message"
        "board moves"
        "fen moves"
        "actions actions"`}
      gridTemplateRows="auto auto 1fr auto auto"
      gridTemplateColumns={`1fr ${SIDEBAR_WIDTH}`}
      gap="4"
      maxW={CONTAINER_MAX_WIDTH}
      mx="auto"
      p="4"
    >
      {props.children}

      <GridItem gridArea="fen" justifySelf="center">
        <FenEditor width={boardWidth} />
      </GridItem>

      <GridItem
        gridArea="board"
        ref={boardContainerRef}
        display="flex"
        justifyContent="center"
        alignItems="start"
        maxW={`${MAX_BOARD_WIDTH}px`}
        justifySelf="center"
      >
        <Box w={boardWidth} h={boardWidth}>
          <Chessboard
            position={props.fen}
            onPieceDrop={props.onPieceDrop}
            boardWidth={boardWidth}
            boardOrientation={props.orientation}
          />
        </Box>
      </GridItem>
    </Grid>
  );
}
