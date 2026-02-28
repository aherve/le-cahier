import type { LinksFunction, MetaFunction } from '@remix-run/node';

import { Authenticator } from '@aws-amplify/ui-react';
import styles from '@aws-amplify/ui-react/styles.css';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { json } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from '@remix-run/react';
import { Amplify } from 'aws-amplify';
import mixpanel from 'mixpanel-browser';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { LCLayout } from './components/layout';
import { WithAnalytics } from './components/with-analytics';
import amplifyConfig from '../infra/aws-export.json';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: amplifyConfig.userPoolId,
      userPoolClientId: amplifyConfig.userPoolWebClientId,
    },
  },
});

export const meta: MetaFunction = () => [
  { charset: 'utf-8' },
  { title: 'Le Cahier' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1' },
];

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: styles,
    },
  ];
};

// Load the GA tracking id from the .env
export const loader = async () => {
  return json({ mixpanelToken: process.env.MIXPANEL_TOKEN });
};

export default function App() {
  const location = useLocation();
  const { mixpanelToken } = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (mixpanelToken && mixpanelToken.length) {
    mixpanel.init(mixpanelToken, { ignore_dnt: true });
  }

  useEffect(() => {
    if (mixpanelToken && mixpanelToken.length && mixpanel.config) {
      mixpanel.track(`View ${location.pathname}`);
    }
  }, [location.pathname, mixpanelToken]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {isClient ? (
          <DndProvider backend={HTML5Backend}>
            <ChakraProvider value={defaultSystem}>
              <Authenticator signUpAttributes={['email']}>
                {({ user }) => {
                  return (
                    <WithAnalytics>
                      <LCLayout user={user} />
                    </WithAnalytics>
                  );
                }}
              </Authenticator>
            </ChakraProvider>
          </DndProvider>
        ) : (
          <ChakraProvider value={defaultSystem}>
            <Authenticator signUpAttributes={['email']}>
              {({ user }) => {
                return (
                  <WithAnalytics>
                    <LCLayout user={user} />
                  </WithAnalytics>
                );
              }}
            </Authenticator>
          </ChakraProvider>
        )}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
