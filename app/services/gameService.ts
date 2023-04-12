import type { Color, Move } from 'chess.js'

import { Chess } from 'chess.js'

export class GameServiceClass {
  private game: Chess
  constructor(fen?: string) {
    this.game = new Chess(fen)
  }

  public makeMove(
    move: string | { from: string; to: string; promotion?: string }
  ) {
    const m = this.game.move(move)
    return m
  }

  public get fen(): string {
    return this.game.fen()
  }

  public get moves(): Move[] {
    return this.game.history({ verbose: true })
  }

  public get turn(): Color {
    return this.game.turn()
  }

  public reset(fen?: string) {
    this.game = new Chess(fen)
    console.log('I have been reset', this.game.fen())
  }

  public backTo(m: Move) {
    while (this.moves[this.moves.length - 1].after !== m.after) {
      this.game.undo()
    }
  }
}

export const GameService = new GameServiceClass()
