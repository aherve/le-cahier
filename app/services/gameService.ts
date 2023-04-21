import type { Color, Move } from 'chess.js';

import { Chess } from 'chess.js';

export class GameServiceClass {
  private game: Chess;
  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  public makeMove(
    move: string | { from: string; to: string; promotion?: string },
  ) {
    const m = this.game.move(move);
    return m;
  }

  public get fen(): string {
    return this.game.fen();
  }

  public isValidMove(move: string | { from: string; to: string }) {
    try {
      const gg = new Chess(this.fen);
      gg.move(move);
      return true;
    } catch {
      return false;
    }
  }

  public get moves(): Move[] {
    return this.game.history({ verbose: true });
  }

  public get turn(): Color {
    return this.game.turn();
  }

  public reset(fen?: string) {
    this.game = new Chess(fen);
  }

  public backTo(m: Move) {
    while (this.moves[this.moves.length - 1].after !== m.after) {
      this.game.undo();
    }
  }
}

export const GameService = new GameServiceClass();
