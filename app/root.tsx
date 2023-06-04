import type { LinksFunction, MetaFunction } from '@remix-run/node';

import { Authenticator } from '@aws-amplify/ui-react';
import styles from '@aws-amplify/ui-react/styles.css';
import { ChakraProvider } from '@chakra-ui/react';
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
import { useEffect } from 'react';

import { LCLayout } from './components/layout';
import { gaPageView } from './services/analytics';
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

// Load the GA tracking id from the .env
export const loader = async () => {
  return json({ gaTrackingId: process.env.GA_TRACKING_ID });
};

export default function App() {
  const location = useLocation();
  const { gaTrackingId } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (gaTrackingId?.length) {
      gaPageView(location.pathname, gaTrackingId);
    }
  }, [location, gaTrackingId]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {!gaTrackingId ? null : (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
            />
            <script
              async
              id="gtag-init"
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaTrackingId}', {
                  page_path: window.location.pathname,
                });
              `,
              }}
            />
          </>
        )}

        <ChakraProvider>
          <Authenticator signUpAttributes={['email']}>
            {({ user }) => LCLayout({ user })}
          </Authenticator>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
