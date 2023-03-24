import {
  Card,
  CardBody,
  Text,
  Flex,
  List,
  Heading,
  CardHeader,
  Link,
} from "@chakra-ui/react";
import type { Color, Move } from "chess.js";
import { Chess } from "chess.js";

export type MoveType = {
  moveIndex: number;
  whiteMove: string;
  blackMove?: string;
  fenBeforeMove: string;
};

export function addMove(
  m: Move,
  moves: Array<MoveType>,
  fenBeforeMove: string
): Array<MoveType> {
  if (m.color === "w") {
    moves.push({
      fenBeforeMove,
      moveIndex: moves.length + 1,
      whiteMove: m.san,
    });
  } else {
    moves[moves.length - 1].blackMove = m.san;
  }
  return moves;
}

export default function Moves(props: {
  moves: Array<MoveType>;
  goTo: (fen: string, moves: Array<MoveType>) => void;
}) {
  function goTo(move: MoveType, color: Color) {
    const g = new Chess(move.fenBeforeMove);
    g.move(move.whiteMove);
    if (color === "b" && move.blackMove) {
      g.move(move.blackMove);
    }
    const newFen = g.fen();

    const newMoves = props.moves.slice(0, move.moveIndex);
    if (color === "w") {
      newMoves[newMoves.length - 1].blackMove = undefined;
    }

    props.goTo(newFen, newMoves);
  }

  return (
    <>
      <Card minWidth="200px">
        <CardHeader>
          <Heading size="sm">Moves</Heading>
        </CardHeader>
        <CardBody>
          <List>
            {props.moves.map((m) => {
              return (
                <MoveItem move={m} goTo={goTo} key={m.moveIndex}></MoveItem>
              );
            })}
          </List>
        </CardBody>
      </Card>
    </>
  );
}

function MoveItem(props: {
  move: MoveType;
  goTo: (move: MoveType, color: Color) => void;
}) {
  return (
    <>
      <Flex direction="row" gap="5" grow="1">
        <Text as="b">{props.move.moveIndex}.</Text>
        <Link onClick={() => props.goTo(props.move, "w")}>
          {props.move.whiteMove}
        </Link>
        <Link onClick={() => props.goTo(props.move, "b")}>
          {props.move.blackMove}
        </Link>
      </Flex>
    </>
  );
}
