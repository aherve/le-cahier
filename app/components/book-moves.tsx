import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  List,
  ListItem,
} from "@chakra-ui/react";
import type { Move } from "chess.js";

export function BookMoves(props: {
  fen: string;
  onNavigate: (move: Move) => void;
}) {
  const bookMoves = ["e4"];
  const opponentMoves = ["e4", "d4", "c4"];

  return (
    <>
      <Flex direction="row" align="center" justifyContent="space-between">
        <Heading size="sm">Book moves:</Heading>
        {bookMoves.map((move) => (
          <Box key={move}>{move}</Box>
        ))}
      </Flex>
    </>
  );
}
