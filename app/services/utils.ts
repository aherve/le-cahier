export function stripFEN(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}
