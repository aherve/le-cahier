import { CognitoJwtVerifier } from "aws-jwt-verify";

import amplifyConfig from "../../infra/aws-export.json";

import { CognitoUserSchema } from "~/schemas/user";

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: amplifyConfig.userPoolId,
  tokenUse: "id",
  clientId: amplifyConfig.userPoolWebClientId,
});

export async function authenticate(request: Request) {
  const jwt =
    request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";

  if (!jwt) {
    throw new Error("No JWT provided");
  }

  const authenticated = await verifier.verify(jwt);
  console.log("auth", authenticated);
  return CognitoUserSchema.parse(authenticated);
}
