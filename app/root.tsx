import type { LinksFunction, MetaFunction } from '@remix-run/node';

import { Authenticator } from '@aws-amplify/ui-react';
import styles from '@aws-amplify/ui-react/styles.css';
import { ChakraProvider } from '@chakra-ui/react';
import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { Analytics } from '@vercel/analytics/react';
import { Amplify } from 'aws-amplify';

import { LCLayout } from './components/layout';
import amplifyConfig from '../infra/aws-export.json';

Amplify.configure(amplifyConfig);

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Le Cahier',
  viewport: 'width=device-width,initial-scale=1',
});

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: styles,
    },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ChakraProvider>
          <Authenticator signUpAttributes={['email']}>
            {({ user }) => LCLayout({ user })}
          </Authenticator>
        </ChakraProvider>
        <ScrollRestoration />
        <Analytics />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
