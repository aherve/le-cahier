import type { LinksFunction, MetaFunction } from "@remix-run/node";

import { Authenticator } from "@aws-amplify/ui-react";
import styles from "@aws-amplify/ui-react/styles.css";
import { ChakraProvider } from "@chakra-ui/react";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { Amplify } from "aws-amplify";

import { amplifyConfig } from "./services/cognito";
import { UserContext } from "./user-context";

Amplify.configure(amplifyConfig);

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Le Cahier",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
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
          <Authenticator>
            {({ signOut, user }) => (
              <UserContext.Provider value={{ user, signOut }}>
                <Outlet />
              </UserContext.Provider>
            )}
          </Authenticator>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
