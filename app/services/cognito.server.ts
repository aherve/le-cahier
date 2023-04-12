import { CognitoJwtVerifier } from "aws-jwt-verify";

import { amplifyConfig } from "./cognito";

// Verifier that expects valid access tokens:

export async function verifyAccessToken(token: string) {
  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: amplifyConfig.userPoolId,
      tokenUse: "id",
      clientId: amplifyConfig.userPoolWebClientId,
    });
    const payload = await verifier.verify(token);
    console.log("VALID PAYLOAD", payload);
    return payload;
  } catch (e) {
    console.error("invalid jwt token", e);
    return null;
  }
}
