import { chunk } from 'lodash'
import {
  Card,
  CardBody,
  Text,
  Flex,
  List,
  Heading,
  CardHeader,
  Link,
} from '@chakra-ui/react'
import type { Move } from 'chess.js'

export default function Moves(props: {
  moves: Array<Move>
  onNavigate: (move: Move) => void
}) {
  const chunks = chunk(props.moves, 2)

  return (
    <>
      <Card minWidth="200px">
        <CardHeader>
          <Heading size="sm">Moves</Heading>
        </CardHeader>
        <CardBody>
          <List>
            {chunks.map((c, i) => {
              return (
                <MoveItem
                  onNavigate={props.onNavigate}
                  movePair={c}
                  moveIndex={i}
                  key={i}
                ></MoveItem>
              )
            })}
          </List>
        </CardBody>
      </Card>
    </>
  )
}

function MoveItem(props: {
  movePair: Move[]
  moveIndex: number
  onNavigate: (m: Move) => void
}) {
  return (
    <>
      <Flex direction="row" gap="5" grow="1">
        <Text as="b">{2 * props.moveIndex + 1}.</Text>
        <Link onClick={() => props.onNavigate(props.movePair[0])}>
          {props.movePair[0].san}
        </Link>
        <Link onClick={() => props.onNavigate(props.movePair[1])}>
          {props.movePair[1]?.san ?? ''}
        </Link>
      </Flex>
    </>
  )
}
