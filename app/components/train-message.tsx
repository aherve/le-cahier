import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react';
import { z } from 'zod';

export const TrainMessageInput = z.enum([
  'yourTurn',
  'nope',
  'noMoreData',
  'empty',
  'hint',
]);
export type TrainMessageInputType = z.infer<typeof TrainMessageInput>;
export default function TrainMessage(props: {
  type: TrainMessageInputType;
  hints?: string[];
}) {
  const hintsStr = props.hints?.join(', ') ?? '';

  switch (props.type) {
    case TrainMessageInput.enum.yourTurn:
      return (
        <Alert status="success">
          <AlertIcon />
          <AlertDescription>It's your turn</AlertDescription>
        </Alert>
      );
    case TrainMessageInput.enum.nope:
      return (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Nope</AlertDescription>
        </Alert>
      );
    case TrainMessageInput.enum.noMoreData:
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>Success ! The book ends here</AlertDescription>
        </Alert>
      );
    case TrainMessageInput.enum.hint:
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>{hintsStr}</AlertDescription>
        </Alert>
      );
    default:
      return null;
  }
}
