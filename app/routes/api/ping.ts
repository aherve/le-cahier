import type { ActionFunction } from "@remix-run/node";

import { json } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  console.log(request);
  return json({ message: "pong" }, { status: 200 });
};
