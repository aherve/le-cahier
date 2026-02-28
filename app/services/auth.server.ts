import type { ListUsersCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import type { CognitoUser } from '~/schemas/user';

import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
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

export async function isAdmin(username: string): Promise<boolean> {
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

export async function listUsers() {
  let hasMore = true;
  let PaginationToken: string | undefined = undefined;

  const userList: Array<{ username: string; sub: string }> = [];

  while (hasMore) {
    const command = new ListUsersCommand({
      UserPoolId: amplifyConfig.userPoolId,
      AttributesToGet: ['sub'],
      PaginationToken,
    });
    const res: ListUsersCommandOutput = await cognitoCli.send(command);
    PaginationToken = res.PaginationToken;
    if (!PaginationToken) {
      hasMore = false;
    }
    const newUsers = (res.Users || []).map((user) => ({
      username: user.Username,
      ...user.Attributes?.reduce(
        (acc, attr) => ({
          ...acc,
          [attr.Name as string]: attr.Value,
        }),
        {},
      ),
    })) as Array<{ username: string; sub: string }>;
    userList.push(...newUsers);
  }

  return userList.reduce(
    (acc, user) => {
      acc[user.sub] = user.username;
      return acc;
    },
    {} as Record<string, string>,
  );
}
