import { Alert } from '@chakra-ui/react';
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
        <Alert.Root status="success">
          <Alert.Indicator />
          <Alert.Description>It's your turn</Alert.Description>
        </Alert.Root>
      );
    case TrainMessageInput.enum.nope:
      return (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Description>Nope</Alert.Description>
        </Alert.Root>
      );
    case TrainMessageInput.enum.noMoreData:
      return (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Description>Success ! The book ends here</Alert.Description>
        </Alert.Root>
      );
    case TrainMessageInput.enum.hint:
      return (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Description>{hintsStr}</Alert.Description>
        </Alert.Root>
      );
    default:
      return null;
  }
}
