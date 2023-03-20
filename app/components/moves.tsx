import { Text, Flex, List, Heading } from "@chakra-ui/react";

export type MoveType = {
  moveIndex: number;
  whiteMove: string;
  blackMove?: string;
};
export default function Moves(props: { moves: Array<MoveType> }) {
  console.log(props.moves);
  return (
    <>
      <Flex direction="column" gap="5">
        <Heading size="sm">Moves</Heading>
        <List>
          {props.moves.map((m) => {
            return <Move move={m} key={m.moveIndex}></Move>;
          })}
        </List>
      </Flex>
    </>
  );
}

function Move(props: { move: MoveType }) {
  return (
    <>
      <Flex direction="row" gap="5" grow="1">
        <Text>{props.move.moveIndex}.</Text>
        <Text>{props.move.whiteMove}</Text>
        <Text>{props.move.blackMove}</Text>
      </Flex>
    </>
  );
}
