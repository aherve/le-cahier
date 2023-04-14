import { z } from "zod";

export const CognitoUserSchema = z
  .object({
    auth_time: z.number(),
    "cognito:username": z.string(),
    email: z.string(),
    email_verified: z.boolean(),
    sub: z.string().uuid(),
  })
  .transform((user) => ({
    authTime: user.auth_time,
    username: user["cognito:username"],
    email: user.email,
    emailVerified: user.email_verified,
    userId: user.sub,
  }));

export type CognitoUser = z.infer<typeof CognitoUserSchema>;
