import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { DynamoChessBookService } from '~/services/dynamo-chess-book'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const fen = url.searchParams.get('fen')
  if (!fen) {
    throw new Error('Missing fen')
  }

  const move = await DynamoChessBookService.getPosition(fen)
  console.log('got move', move)
  return json(move)
}
