import type { CognitoUser } from '~/schemas/user';

import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import Cookies from 'universal-cookie';

import amplifyConfig from '../../infra/aws-export.json';

import { CognitoUserSchema } from '~/schemas/user';
const cognitoCli = new CognitoIdentityProviderClient({
  region: amplifyConfig.region,
});

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
  const user = CognitoUserSchema.parse(authenticated);

  return user;
}

export async function isAdmin(username: string): Promise<Boolean> {
  const user = await cognitoCli.send(
    new AdminGetUserCommand({
      UserPoolId: amplifyConfig.userPoolId,
      Username: username,
    }),
  );
  if (!user) return false;

  for (const attr of user.UserAttributes ?? []) {
    if (attr.Name === 'dev:custom:isAdmin') {
      return attr.Value === 'true';
    }
  }

  return false;
}
