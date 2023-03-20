import {
  Card,
  CardBody,
  Text,
  Flex,
  List,
  Heading,
  CardHeader,
} from "@chakra-ui/react";

export type MoveType = {
  moveIndex: number;
  whiteMove: string;
  blackMove?: string;
};
export default function Moves(props: { moves: Array<MoveType> }) {
  console.log(props.moves);
  return (
    <>
      <Card minWidth="200px">
        <CardHeader>
          <Heading size="sm">Moves</Heading>
        </CardHeader>
        <CardBody>
          <List>
            {props.moves.map((m) => {
              return <Move move={m} key={m.moveIndex}></Move>;
            })}
          </List>
        </CardBody>
      </Card>
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
