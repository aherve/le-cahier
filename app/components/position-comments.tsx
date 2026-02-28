import type { BoardOrientation } from 'react-chessboard/dist/chessboard/types';

import {
  Button,
  Spinner,
  Stack,
  Textarea,
  Wrap,
  WrapItem,
  Text,
  createToaster,
} from '@chakra-ui/react';
import { Form } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { FaRegEdit, FaRegSave } from 'react-icons/fa';

const toaster = createToaster({
  placement: 'top',
  duration: 5000,
});

export function PositionComments(props: {
  orientation: BoardOrientation;
  fen: string;
  comments?: string;
}) {
  const [editMode, setEditMode] = useState(false);
  const [comments, setComments] = useState(props.comments ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // prevents a comment to stay after we added it
  useEffect(
    () => setComments(props.comments ?? ''),
    [props.comments, props.fen],
  );

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
        toaster.create({
          title: 'Error saving comment',
          type: 'error',
        });
      }
    });
  }

  return (
    <Stack alignItems="center">
      {editMode && !isSaving && (
        <DisplayEdit
          comments={comments}
          submit={saveComment}
          cancel={() => setEditMode(false)}
        />
      )}

      {!editMode && !isSaving && (
        <DisplayComment
          comments={comments}
          setEditMode={() => setEditMode(true)}
        />
      )}

      {isSaving && <Spinner />}
    </Stack>
  );
}

function DisplayEdit(props: {
  comments: string;
  submit: (comment: string) => void;
  cancel: () => void;
}) {
  const [comments, setComments] = useState(props.comments ?? '');

  function updateComments(evt: any) {
    setComments(evt.target.value);
  }

  function cancel() {
    setComments(props.comments ?? '');
    props.cancel();
  }

  return (
    <Form onSubmit={() => props.submit(comments)}>
      <Stack>
        <Textarea
          autoFocus={true}
          onChange={updateComments}
          value={comments}
        />
        <Wrap alignSelf="end">
          <Button onClick={cancel}>Cancel</Button>
          <Button leftIcon={<FaRegSave />} type="submit">
            Save
          </Button>
        </Wrap>
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
