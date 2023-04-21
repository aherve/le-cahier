import type { CognitoUser } from '~/schemas/user';

import { CognitoJwtVerifier } from 'aws-jwt-verify';
import Cookies from 'universal-cookie';

import amplifyConfig from '../../infra/aws-export.json';

import { CognitoUserSchema } from '~/schemas/user';

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: amplifyConfig.userPoolId,
  tokenUse: 'id',
  clientId: amplifyConfig.userPoolWebClientId,
});

export async function authenticate(request: Request): Promise<CognitoUser> {
  const cognitoCookie = await new Cookies(request.headers.get('cookie')).get(
    'cognito',
  );

  if (!cognitoCookie) {
    throw new Error('No cognito cookie found');
  }

  const { idToken } = cognitoCookie;
  if (!idToken) {
    throw new Error('No idToken found in cookie');
  }

  const authenticated = await verifier.verify(idToken);
  return CognitoUserSchema.parse(authenticated);
}
