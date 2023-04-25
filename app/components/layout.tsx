import type { AmplifyUser } from '@aws-amplify/ui';

import { Authenticator } from '@aws-amplify/ui-react';
import { Grid, GridItem } from '@chakra-ui/react';
import { Outlet } from '@remix-run/react';
import Cookies from 'universal-cookie';

import { Footer } from './footer';
import { LCMenu } from './menu';

import { WithGame } from '~/with-game';

export function LCLayout(props: { user: AmplifyUser | undefined }) {
  const expiresAtSeconds =
    props.user?.getSignInUserSession()?.getIdToken().getExpiration() ??
    Math.round(Date.now() / 1000 + 24 * 3600);

  new Cookies().set(
    'cognito',
    {
      idToken: props.user?.getSignInUserSession()?.getIdToken().getJwtToken(),
    },
    {
      expires: new Date(1000 * expiresAtSeconds),
    },
  );

  return (
    <Authenticator.Provider>
      <WithGame>
        <Grid
          padding="10px"
          templateAreas={'"header" "main" "footer"'}
          gridTemplateRows="auto 1fr auto"
          gridTemplateColumns="1fr"
          h="100vh"
        >
          <GridItem gridArea="header">
            <LCMenu />
          </GridItem>
          <GridItem gridArea="main" justifySelf="center">
            <Outlet />
          </GridItem>
          <GridItem gridArea="footer" justifySelf="center">
            <Footer />
          </GridItem>
        </Grid>
      </WithGame>
    </Authenticator.Provider>
  );
}
