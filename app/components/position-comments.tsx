import type { ActionFunction } from '@remix-run/node';
import type { ChangeEventHandler, FormEvent } from 'react';
import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import {
  Button,
  FormControl,
  Spinner,
  Stack,
  StackItem,
  Textarea,
  useToast,
  Wrap,
  WrapItem,
  Text,
} from '@chakra-ui/react';
import { Form } from '@remix-run/react';
import { useState } from 'react';
import { FaRegEdit, FaRegSave } from 'react-icons/fa';

export function PositionComments(props: {
  orientation: BoardOrientation;
  fen: string;
  comments?: string;
}) {
  const toast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [comments, setComments] = useState(props.comments ?? '');
  const [isSaving, setIsSaving] = useState(false);

  function saveComment(newComment: string) {
    setEditMode(false);
    setIsSaving(true);
    fetch('/api/moves/add-comment', {
      method: 'POST',
      body: JSON.stringify({
        comment: newComment,
        fen: props.fen,
        orientation: props.orientation,
      }),
    }).then((res) => {
      setIsSaving(false);
      if (res.ok) {
        setComments(newComment);
      } else {
        toast({
          title: 'Error saving comment',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    });
  }

  return (
    <Stack>
      <StackItem alignSelf="center">
        {editMode && !isSaving && (
          <DisplayEdit comments={comments} submit={saveComment} />
        )}

        {!editMode && !isSaving && (
          <DisplayComment
            comments={comments}
            setEditMode={() => setEditMode(true)}
          />
        )}

        {isSaving && <Spinner />}
      </StackItem>
    </Stack>
  );
}

function DisplayEdit(props: {
  comments: string;
  submit: (comment: string) => void;
}) {
  const [comments, setComments] = useState(props.comments ?? '');

  function updateComments(evt: any) {
    setComments(evt.target.value);
  }

  return (
    <Form onSubmit={() => props.submit(comments)}>
      <Stack>
        <FormControl>
          <Textarea
            autoFocus={true}
            onChange={updateComments}
            value={comments}
          />
        </FormControl>
        <Button alignSelf="end" leftIcon={<FaRegSave />} type="submit">
          Save
        </Button>
      </Stack>
    </Form>
  );
}

function DisplayComment(props: { comments: string; setEditMode: () => void }) {
  return (
    <Stack>
      <Wrap>
        <WrapItem whiteSpace="pre-wrap">
          <Text>{props.comments}</Text>
        </WrapItem>
      </Wrap>
      <Button onClick={props.setEditMode} leftIcon={<FaRegEdit />} size="xs">
        {props.comments ? 'Edit' : 'Add comments'}
      </Button>
    </Stack>
  );
}
