import type { Move } from "chess.js";
import { Chess } from "chess.js";

export class GameServiceClass {
  private game: Chess;
  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  public makeMove(
    move: string | { from: string; to: string; promotion?: string }
  ) {
    const m = this.game.move(move);
    return m;
  }

  public get fen(): string {
    return this.game.fen();
  }

  public get moves(): Move[] {
    return this.game.history({ verbose: true });
  }

  public reset(fen?: string) {
    this.game = new Chess(fen);
    console.log("I have been reset", this.game.fen());
  }
}

export const GameService = new GameServiceClass();
