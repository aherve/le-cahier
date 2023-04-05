import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const form = Object.fromEntries(await request.formData());
  const game = JSON.parse(form.payload as string);

  console.log(game.id);

  return json({ gameId: game.id });
};
