import type { LoaderFunction } from '@remix-run/node';

import { redirect } from '@remix-run/node';
import parseurl from 'parseurl';

import { commitSession, getSession } from '~/session';

const ONE_YEAR_IN_SECONDS = 3600 * 24 * 365;

export const loader: LoaderFunction = async ({ request }) => {
  const code = new URL(request.url).searchParams.get('code');
  if (!code) {
    throw 'missing code';
  }
  const parsed = parseurl.original(request as any);
  if (!parsed) {
    throw new Error('No parsed url');
  }
  let protocol = parsed.hostname === 'localhost' ? 'http' : 'https';

  const baseURL = protocol + '://' + parsed.host;
  const session = await getSession(request.headers.get('Cookie'));
  const verifier = session.get('codeVerifier');
  if (!verifier) {
    throw new Error('No verifier');
  }

  const lichessToken = await getLichessToken(code, verifier, baseURL);

  if (!lichessToken.access_token) {
    throw 'Failed getting token';
  }
  const expiresInSeconds = lichessToken.expires_in ?? ONE_YEAR_IN_SECONDS;

  const lichessUser = await getLichessUser(lichessToken.access_token);

  session.set('lichessUsername', lichessUser.username);
  session.set('lichessAccessToken', lichessToken.access_token);

  return redirect('/lichess-report', {
    headers: {
      'Set-Cookie': await commitSession(session, {
        maxAge: expiresInSeconds,
      }),
    },
  });
};

async function getLichessToken(
  authCode: string,
  verifier: string,
  url: string,
) {
  return fetch('https://lichess.org/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      redirect_uri: `${url}/lichess/callback`,
      client_id: 'le-cahier',
      code: authCode,
      code_verifier: verifier,
    }),
  }).then((res) => res.json());
}

async function getLichessUser(accessToken: string) {
  return fetch('https://lichess.org/api/account', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res.json());
}
