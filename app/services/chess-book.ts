import { Chess } from "chess.js";
import { JsonDB, Config } from "node-json-db";
import { z } from "zod";
import type { SaveMoveInput } from "~/routes/api/save";

const separator = "|";

export const BookMoveSchema = z.object({
  move: z.string(),
  targetFEN: z.string(),
  comments: z
    .string()
    .regex(/^[^|]*$/)
    .optional(),
});
export type BookMove = z.infer<typeof BookMoveSchema>;
export const BookPositionSchema = z.object({
  fen: z.string(),
  bookMoves: z.record(z.string(), BookMoveSchema).default({}),
  opponentMoves: z.record(z.string(), BookMoveSchema).default({}),
});
export type BookPosition = z.infer<typeof BookPositionSchema>;

export class ChessBook {
  private db: JsonDB;
  constructor() {
    // The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
    // The second argument is used to tell the DB to save after each push
    // If you put false, you'll have to call the save() method.
    // The third argument is to ask JsonDB to save the database in an human readable format. (default false)
    // The last argument is the separator. By default it's slash (/)
    this.db = new JsonDB(new Config("public/db.json", true, false, separator));
  }

  public async addMove(input: SaveMoveInput) {
    const { isOpponentMove, fen, move, comments } = input;
    console.log("adding move", input);

    const game = new Chess(fen);
    game.move(move);
    const bookMove = BookMoveSchema.parse({
      move,
      comments,
      targetFEN: game.fen(),
    });

    const path = isOpponentMove ? "opponentMoves" : "bookMoves";
    this.db.push(`${separator}${fen}${separator}fen`, fen, true);
    this.db.push(["", fen, path, move].join(separator), bookMove, true);
  }

  public async getRandomOpponentMove(fen: string) {
    console.log("getting data from", fen);
    const position = await this.db.getData(separator + fen);
    if (!position) {
      return null;
    }
    console.log("got db position", position);
    const { opponentMoves } = BookPositionSchema.parse(position);
    const moveList = Object.keys(opponentMoves);
    const randomIndex = Math.floor(Math.random() * moveList.length);
    return opponentMoves[moveList[randomIndex]];
  }

  public async getPosition(fen: string) {
    const data = await this.db.getData(separator + fen);
    if (!data) {
      return null;
    }

    return BookPositionSchema.parse(data);
  }

  public async dump() {
    return this.db.getData(separator);
  }
}

export const ChessBookService = new ChessBook();
