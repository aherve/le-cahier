import {
  Card,
  CardBody,
  Text,
  Flex,
  List,
  Heading,
  CardHeader,
} from "@chakra-ui/react";
import type { Move } from "chess.js";

export type MoveType = {
  moveIndex: number;
  whiteMove: string;
  blackMove?: string;
};

export function addMove(m: Move, moves: Array<MoveType>): Array<MoveType> {
  if (m.color === "w") {
    moves.push({ moveIndex: moves.length + 1, whiteMove: m.san });
  } else {
    moves[moves.length - 1].blackMove = m.san;
  }
  return moves;
}

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
              return <MoveItem move={m} key={m.moveIndex}></MoveItem>;
            })}
          </List>
        </CardBody>
      </Card>
    </>
  );
}

function MoveItem(props: { move: MoveType }) {
  return (
    <>
      <Flex direction="row" gap="5" grow="1">
        <Text as="b">{props.move.moveIndex}.</Text>
        <Text>{props.move.whiteMove}</Text>
        <Text>{props.move.blackMove}</Text>
      </Flex>
    </>
  );
}
