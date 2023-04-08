import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Chess } from "chess.js";

export function stripFEN(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

export const BasicAuthHeaders = () => ({
  "WWW-Authenticate": "Basic",
});
function isAuthorized(request: Request) {
  const header = request.headers.get("Authorization");

  if (!header) return false;

  const base64 = header.replace("Basic ", "");
  const [username, password] = Buffer.from(base64, "base64")
    .toString()
    .split(":");

  return (
    username === process.env.BASIC_AUTH_USERNAME &&
    password === process.env.BASIC_AUTH_PASSWORD
  );
}

export const basicAuthLoader: LoaderFunction = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json({ authorized: false }, { status: 401 });
  }
  return json({ authorized: true });
};

export function toSAN(fen: string, move: string) {
  const g = new Chess(fen);
  try {
    const m = g.move(move);
    return m.san;
  } catch {
    return move;
  }
}
