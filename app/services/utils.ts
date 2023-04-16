import { Chess } from 'chess.js';

export function stripFEN(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
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

export function inOneMonthUnix() {
  return Math.round(Date.now() / 1000 + 30 * 24 * 3600);
}
