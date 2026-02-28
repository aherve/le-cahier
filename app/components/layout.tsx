import type { AmplifyUser } from '@aws-amplify/ui';

import { Authenticator } from '@aws-amplify/ui-react';
import { Grid, GridItem } from '@chakra-ui/react';
import { Outlet } from '@remix-run/react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect } from 'react';
import Cookies from 'universal-cookie';

import { Footer } from './footer';
import { LCMenu } from './menu';

import { WithGame } from '~/with-game';

export function LCLayout(props: { user: AmplifyUser | undefined }) {
  useEffect(() => {
    if (props.user) {
      fetchAuthSession().then((session) => {
        const idToken = session.tokens?.idToken?.toString();
        const expiresAtSeconds =
          session.tokens?.idToken?.payload.exp ??
          Math.round(Date.now() / 1000 + 24 * 3600);

        new Cookies().set(
          'cognito',
          { idToken },
          { expires: new Date(1000 * expiresAtSeconds) },
        );
      });
    }
  }, [props.user]);

  return (
    <Authenticator.Provider>
      <WithGame>
        <Grid
          padding="10px"
          templateAreas={'"header" "main" "footer"'}
          gridTemplateRows="auto 1fr auto"
          gridTemplateColumns="1fr"
          h="100vh"
          minWidth={0}
          maxWidth="100vw"
          overflowX="hidden"
        >
          <GridItem w="100%" gridArea="header" minWidth={0}>
            <LCMenu />
          </GridItem>
          <GridItem
            w="100%"
            gridArea="main"
            justifySelf="center"
            minWidth={0}
            overflowY="auto"
          >
            <Outlet />
          </GridItem>
          <GridItem
            w="100%"
            gridArea="footer"
            justifySelf="center"
            minWidth={0}
          >
            <Footer />
          </GridItem>
        </Grid>
      </WithGame>
    </Authenticator.Provider>
  );
}
