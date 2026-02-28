import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import { Box, Grid, GridItem } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { ClientOnly } from 'remix-utils/client-only';

import { FenEditor } from './fen-editor';

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
          boardContainerRef.current.clientHeight
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
      templateAreas={`"title title title"
        "message message message"
        "spacer board moves"
        "spacer fen moves"
        "actions actions actions"`}
      gridTemplateRows="auto auto 1fr auto auto"
      gridTemplateColumns="1fr auto minmax(400px, 500px)"
      gap="8"
      p="2"
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
        justifySelf="center"
      >
        <Box w={boardWidth} h={boardWidth}>
          <ClientOnly fallback={<div style={{ width: boardWidth, height: boardWidth, background: '#eee' }} />}>
            {() => (
              <Chessboard
                position={props.fen}
                onPieceDrop={props.onPieceDrop}
                boardWidth={boardWidth}
                boardOrientation={props.orientation}
              />
            )}
          </ClientOnly>
        </Box>
      </GridItem>
    </Grid>
  );
}
