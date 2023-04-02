import { Chess } from "chess.js";
import { JsonDB, Config } from "node-json-db";
import { z } from "zod";
import type { SaveMoveInput } from "~/routes/api/moves/create";
import { stripFEN } from "./utils";

const sep = "|";

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
    this.db = new JsonDB(new Config("public/db.json", true, false, sep));
  }

  public async addMove(input: SaveMoveInput) {
    const { isOpponentMove, fen, move, comments } = input;
    console.log("adding move", input);

    const game = new Chess(fen);
    game.move(move);
    const bookMove = BookMoveSchema.parse({
      move,
      comments,
      targetFEN: stripFEN(game.fen()),
    });

    const path = isOpponentMove ? "opponentMoves" : "bookMoves";
    await Promise.all([
      this.db.push(`${sep}${stripFEN(fen)}${sep}fen`, stripFEN(fen), true),
      this.db.push(["", stripFEN(fen), path, move].join(sep), bookMove, true),
    ]);
  }

  public async getRandomOpponentMove(fen: string): Promise<BookMove | null> {
    const position = await this.getPosition(stripFEN(fen));
    if (!position) {
      return null;
    }
    const opponentMoves = position.opponentMoves;
    const moveList = Object.keys(opponentMoves);
    if (moveList.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * moveList.length);
    return opponentMoves[moveList[randomIndex]];
  }

  public async dump() {
    return this.db.getData(sep);
  }

  public async linkGraph() {
    const db = new JsonDB(new Config("public/db.json", false, false, sep));
    await db.load();
    let linked = 0;
    const allPositions = await db.getData(sep);
    for (const fen of Object.keys(allPositions)) {
      const position = BookPositionSchema.parse(allPositions[fen]);
      for (const bookMoveKey of Object.keys(position.bookMoves)) {
        const bookMove = position.bookMoves[bookMoveKey];
        const g = new Chess(bookMove.targetFEN);

        const validMoves = g.moves();

        for (const validMove of validMoves) {
          try {
            const gg = new Chess(bookMove.targetFEN);
            const cleanMove = gg.move(validMove);
            const strippedFEN = stripFEN(gg.fen());

            const found = BookPositionSchema.parse(
              await db.getData(sep + strippedFEN)
            );

            const newMove: BookMove = {
              move: cleanMove.lan,
              targetFEN: found.fen,
            };

            await db.push(
              `${sep}${stripFEN(g.fen())}${sep}fen`,
              stripFEN(g.fen())
            );
            await db.push(
              `${sep}${stripFEN(g.fen())}${sep}opponentMoves${sep}${
                cleanMove.lan
              }`,
              newMove
            );
            linked++;
          } catch {}
        }
      }
    }
    console.log(`(re)created ${linked} connections`);
    await db.save();
  }

  public async normalize() {
    const db = new JsonDB(new Config("public/db.json", false, false, sep));
    await db.load();
    const allPositions = await db.getData(sep);
    for (const [originalKey, pos] of Object.entries(allPositions)) {
      const position = BookPositionSchema.parse(pos);

      // normalize db key
      const newKey = stripFEN(position.fen);
      // normalize book moves
      position.fen = newKey;
      for (const [k, v] of Object.entries(position.bookMoves)) {
        position.bookMoves[k] = {
          ...v,
          targetFEN: stripFEN(v.targetFEN),
        };
      }
      for (const [k, v] of Object.entries(position.opponentMoves)) {
        position.opponentMoves[k] = {
          ...v,
          targetFEN: stripFEN(v.targetFEN),
        };
      }

      await db.push(`${sep}${newKey}`, position);

      if (newKey != originalKey) {
        await db.delete(`${sep}${originalKey}`);
      }
    }
    await db.save();
  }

  protected async getPosition(fen: string): Promise<BookPosition | null> {
    try {
      const data = await this.db.getData(sep + stripFEN(fen));
      const parsed = BookPositionSchema.safeParse(data);
      if (!parsed.success) {
        console.error("could not parse position", { data });
        throw new Error("could not parsed position document");
      }
      return parsed.data;
    } catch {
      return null;
    }
  }
}

export const ChessBookService = new ChessBook();
