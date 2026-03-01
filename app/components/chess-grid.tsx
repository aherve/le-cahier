import type {
  BoardOrientation,
  Square,
} from 'react-chessboard/dist/chessboard/types';

import { Box, Grid, GridItem } from '@chakra-ui/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';

import { FenEditor } from './fen-editor';

const MAX_BOARD_SIZE = 560;

const BoardWidthContext = createContext<number>(0);

export function useBoardWidth() {
  return useContext(BoardWidthContext);
}

export function ChessGrid(props: {
  children: React.ReactNode;
  fen: string;
  onPieceDrop: (from: Square, to: Square) => boolean;
  orientation: BoardOrientation;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      let size = Math.min(el.clientWidth, MAX_BOARD_SIZE);

      // On desktop, also fit within available viewport height
      if (window.matchMedia('(min-width: 62em)').matches) {
        const belowBoard = 200; // fen row + actions row + gaps + footer + padding
        const available = window.innerHeight - el.getBoundingClientRect().top - belowBoard;
        size = Math.min(size, Math.max(available, 200));
      }

      setBoardWidth(size);
    };

    const observer = new ResizeObserver(compute);
    window.addEventListener('resize', compute);

    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  return (
    <BoardWidthContext.Provider value={boardWidth}>
      <Grid
        templateAreas={{
          base: `"title"
                 "message"
                 "board"
                 "fen"
                 "moves"
                 "actions"`,
          lg: `"title title title"
               "message message message"
               "spacer board moves"
               "actions actions actions"`,
        }}
        gridTemplateRows={{
          base: 'auto auto auto auto auto auto',
          lg: 'auto auto 1fr auto',
        }}
        gridTemplateColumns={{
          base: '1fr',
          lg: 'minmax(0, 1fr) minmax(0, 560px) minmax(0, 500px)',
        }}
        gap={{ base: 2, md: 8 }}
        p={{ base: 1, md: 2 }}
        minWidth={0}
      >
        {props.children}

        <GridItem gridArea="fen" justifySelf="center" display={{ base: 'block', lg: 'none' }}>
          <FenEditor width={boardWidth} />
        </GridItem>

        <GridItem
          gridArea="board"
          ref={containerRef}
          minWidth={0}
          overflow="hidden"
        >
          {boardWidth > 0 && (
            <Box width={boardWidth} marginX="auto">
              <Chessboard
                position={props.fen}
                onPieceDrop={props.onPieceDrop}
                boardWidth={boardWidth}
                boardOrientation={props.orientation}
              />
              <Box display={{ base: 'none', lg: 'block' }} mt={2}>
                <FenEditor width={boardWidth} />
              </Box>
            </Box>
          )}
        </GridItem>
      </Grid>
    </BoardWidthContext.Provider>
  );
}
