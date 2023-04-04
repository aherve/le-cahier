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
      <Flex direction="row" alignContent="start" justifyContent="space-between">
        <Text as="b" flex="1 1 0">
          {2 * props.moveIndex + 1}.
        </Text>
        <Link flex="2 1 0" onClick={() => props.onNavigate(props.movePair[0])}>
          {props.movePair[0].san}
        </Link>
        <Link flex="2 1 0" onClick={() => props.onNavigate(props.movePair[1])}>
          {props.movePair[1]?.san ?? ''}
        </Link>
      </Flex>
    </>
  )
}
