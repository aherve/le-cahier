import { Chess } from "chess.js";

export function stripFEN(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

export function toSAN(fen: string, move: string) {
  const g = new Chess(fen);
  try {
    const m = g.move(move);
    return m.san;
  } catch {
    return move;
  }
}
