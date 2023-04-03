import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { z } from 'zod'
import { DynamoChessBookService } from '~/services/dynamo-chess-book'

export const SaveMoveInputSchema = z.object({
  comments: z.string().optional(),
  fen: z.string(),
  isOpponentMove: z.boolean(),
  move: z.string(),
})
export type SaveMoveInput = z.infer<typeof SaveMoveInputSchema>

export const action: ActionFunction = async ({ request }) => {
  const input = SaveMoveInputSchema.parse(await request.json())
  await DynamoChessBookService.addMove(input)

  return json({ success: true })
}
