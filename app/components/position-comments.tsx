import type { ChangeEventHandler, FormEvent } from 'react';

import {
  Button,
  FormControl,
  Stack,
  StackItem,
  Textarea,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Form } from '@remix-run/react';
import { useState } from 'react';
import { FaRegEdit } from 'react-icons/fa';

export function PositionComments(props: { comments?: string }) {
  const [editMode, setEditMode] = useState(false);
  const comments = props.comments ?? '';

  return (
    <Stack>
      <StackItem alignSelf="center">
        {editMode ? (
          <DisplayEdit comments={comments} />
        ) : (
          <DisplayComment
            comments={comments}
            setEditMode={() => setEditMode(true)}
          />
        )}
      </StackItem>
    </Stack>
  );
}

function DisplayEdit(props: { comments: string }) {
  const [comments, setComments] = useState(props.comments ?? '');

  function updateComments(evt: any) {
    setComments(evt.target.value);
  }

  return (
    <Form method="post">
      <FormControl>
        <Textarea onChange={updateComments} value={comments} />
      </FormControl>
    </Form>
  );
}

function DisplayComment(props: { comments: string; setEditMode: () => void }) {
  return (
    <Stack>
      <Wrap>
        <WrapItem>{props.comments}</WrapItem>
      </Wrap>
      <Button onClick={props.setEditMode} leftIcon={<FaRegEdit />} size="xs">
        {props.comments ? 'Edit' : 'Add comments'}
      </Button>
    </Stack>
  );
}
