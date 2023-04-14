import type { LoaderFunction } from "@remix-run/node";

import { json } from "@remix-run/node";

import { authenticate } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticate(request);
  return json({ user: user, message: "pong" }, { status: 200 });
};
