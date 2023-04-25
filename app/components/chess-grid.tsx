import { Grid } from '@chakra-ui/react';

export function ChessGrid(props: { children: React.ReactNode }) {
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
    </Grid>
  );
}
