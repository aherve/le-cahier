// app/sessions.ts
import { createCookieSessionStorage } from '@remix-run/node'; // or cloudflare/deno

type SessionData = {
  lichessUsername?: string;
  lichessAccessToken?: string;
  codeVerifier?: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: '__session',

      // all of these are optional
      //domain: 'remix.run',
      // Expires can also be set (although maxAge overrides it when used in combination).
      // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
      //
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      maxAge: 60,
      path: '/',
      sameSite: 'lax',
      secrets: [getSecret()],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };

function getSecret() {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('generating a session secret for development');
    return 's3cret';
  }

  throw new Error('No SESSION_SECRET found in production environment');
}
