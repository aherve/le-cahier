import type { LoaderFunction } from '@remix-run/node';

import crypto from 'crypto';

import { redirect } from '@remix-run/node';
import parseurl from 'parseurl';

import { commitSession, getSession } from '~/session';

export const loader: LoaderFunction = async ({ request }) => {
  const parsed = parseurl.original(request as any);
  if (!parsed) {
    throw new Error('No parsed url');
  }

  let protocol = parsed.hostname === 'localhost' ? 'http' : 'https';

  const baseURL = protocol + '://' + parsed.host;
  const verifier = createVerifier();
  const challenge = createChallenge(verifier);

  const session = await getSession(request.headers.get('Cookie'));
  session.set('lichessUsername', undefined);
  session.set('lichessAccessToken', undefined);
  session.set('codeVerifier', verifier);

  return redirect(
    'https://lichess.org/oauth?' +
      new URLSearchParams({
        response_type: 'code',
        client_id: 'le-cahier',
        redirect_uri: `${baseURL}/lichess/callback`,
        //scope: 'preference:read',
        code_challenge_method: 'S256',
        code_challenge: challenge,
      }),
    {
      headers: {
        'Set-Cookie': await commitSession(session, {
          maxAge: 3600,
        }),
      },
    },
  );
};

function URLSafeBase64Encode(buf: Buffer) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(str: string) {
  return crypto.createHash('sha256').update(str).digest();
}

function createVerifier() {
  return URLSafeBase64Encode(crypto.randomBytes(32));
}

function createChallenge(verifier: string) {
  return URLSafeBase64Encode(sha256(verifier));
}
