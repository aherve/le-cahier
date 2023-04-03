import { JsonDB, Config } from 'node-json-db'

const sep = '|'

export class LegacyChessBook {
  private db: JsonDB
  constructor() {
    // The first argument is the database filename. If no extension, '.json' is assumed and automatically added.
    // The second argument is used to tell the DB to save after each push
    // If you put false, you'll have to call the save() method.
    // The third argument is to ask JsonDB to save the database in an human readable format. (default false)
    // The last argument is the separator. By default it's slash (/)
    this.db = new JsonDB(new Config('/db.json', true, false, sep))
  }

  public async linkGraph() {
    /*
     *    const db = new JsonDB(new Config('public/db.json', false, false, sep))
     *    await db.load()
     *    let linked = 0
     *    const allPositions = await db.getData(sep)
     *    for (const fen of Object.keys(allPositions)) {
     *      const position = BookPositionSchema.parse(allPositions[fen])
     *      for (const bookMoveKey of Object.keys(position.bookMoves)) {
     *        const bookMove = position.bookMoves[bookMoveKey]
     *        const g = new Chess(bookMove.targetFEN)
     *
     *        const validMoves = g.moves()
     *
     *        for (const validMove of validMoves) {
     *          try {
     *            const gg = new Chess(bookMove.targetFEN)
     *            const cleanMove = gg.move(validMove)
     *            const strippedFEN = stripFEN(gg.fen())
     *
     *            const found = BookPositionSchema.parse(
     *              await db.getData(sep + strippedFEN)
     *            )
     *
     *            const newMove: BookMove = {
     *              //move: cleanMove.lan,
     *              targetFEN: found.fen,
     *            }
     *
     *            await db.push(
     *              `${sep}${stripFEN(g.fen())}${sep}fen`,
     *              stripFEN(g.fen())
     *            )
     *            await db.push(
     *              `${sep}${stripFEN(g.fen())}${sep}opponentMoves${sep}${
     *                cleanMove.lan
     *              }`,
     *              newMove
     *            )
     *            linked++
     *          } catch {}
     *        }
     *      }
     *    }
     *    console.log(`(re)created ${linked} connections`)
     *    await db.save()
     */
    return
  }
}

export const LegacyChessBookService = new LegacyChessBook()
