import type { ActionFunction, MetaFunction } from '@remix-run/node';

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
} from '@chakra-ui/react';
import { redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { authenticate } from '~/services/auth.server';
import { UserService } from '~/services/users.server';

const LICHESS_USERNAME = 'lichessUsername';

export const action: ActionFunction = async ({ request }) => {
  const [userId, lichessUsername] = await Promise.all([
    //
    authenticate(request).then((u) => u.userId),
    request.formData().then((f) => f.get(LICHESS_USERNAME)),
  ]);

  if (!lichessUsername) {
    throw new Error('lichess username is required');
  }

  await UserService.setLichessUsername(userId, lichessUsername as string);
  return redirect('/');
};

export const meta: MetaFunction = () => {
  return {
    title: 'Settings | Le Cahier',
    description: 'settings',
  };
};

export default function Settings() {
  return (
    <>
      <Flex textAlign="center" direction="column" align="center" gap="10">
        <Heading>Settings</Heading>
        <Form method="post">
          <FormControl>
            <FormLabel>Your lichess account</FormLabel>
            <Input type="text" name={LICHESS_USERNAME} />
          </FormControl>
          <Button type="submit" formMethod="post" margin="5">
            save
          </Button>
        </Form>
      </Flex>
    </>
  );
}
