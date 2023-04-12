import type { LoaderFunction } from "@remix-run/node";

import { json } from "@remix-run/node";

import { verifyAccessToken } from "~/services/cognito.server";

export const loader: LoaderFunction = async ({ request }) => {
  const jwt =
    request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  console.log("Jwt = ", jwt);
  const isValid = await verifyAccessToken(jwt);

  return json({ validJWT: isValid, message: "pong" }, { status: 200 });
};
