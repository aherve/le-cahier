import { Alert } from '@chakra-ui/react'
import { z } from 'zod'

export const TrainMessageInput = z.enum([
  'yourTurn',
  'nope',
  'noMoreData',
  'empty',
  'hint',
])
export type TrainMessageInputType = z.infer<typeof TrainMessageInput>
export default function TrainMessage(props: {
  type: TrainMessageInputType
  hints?: string[]
}) {
  const hintsStr = props.hints?.join(', ') ?? ''

  switch (props.type) {
    case TrainMessageInput.enum.yourTurn:
      return <Alert status="success">It's your turn</Alert>
    case TrainMessageInput.enum.nope:
      return <Alert status="error">Nope</Alert>
    case TrainMessageInput.enum.noMoreData:
      return <Alert status="info">Success ! The book ends here</Alert>
    case TrainMessageInput.enum.hint:
      return <Alert status="info">{hintsStr}</Alert>
    default:
      return null
  }
}
