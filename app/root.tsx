import type { AmplifyUser } from '@aws-amplify/ui'
import type { LinksFunction, MetaFunction } from '@remix-run/node'

import { Authenticator } from '@aws-amplify/ui-react'
import styles from '@aws-amplify/ui-react/styles.css'
import { ChakraProvider } from '@chakra-ui/react'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import { Amplify } from 'aws-amplify'
import Cookies from 'universal-cookie'

import amplifyConfig from '../infra/aws-export.json'

Amplify.configure(amplifyConfig)

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Le Cahier',
  viewport: 'width=device-width,initial-scale=1',
})

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: styles,
    },
  ]
}

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
            {({ user }) => withAuth({ user })}
          </Authenticator>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

function withAuth(props: { user: AmplifyUser | undefined }) {
  new Cookies().set('cognito', {
    idToken: props.user?.getSignInUserSession()?.getIdToken().getJwtToken(),
  })

  return (
    <Authenticator.Provider>
      <Outlet />
    </Authenticator.Provider>
  )
}
