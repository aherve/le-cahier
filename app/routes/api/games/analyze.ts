import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { LichessGameSchema } from '~/schemas/lichess'

import cache from 'memory-cache'

export const loader: LoaderFunction = async ({ request }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    throw new Error('Missing id')
  }

  const cachedGame = cache.get(id)
  if (!cachedGame) {
    throw new Error('Game not found in cache')
  }

  const game = LichessGameSchema.parse(cachedGame)

  return json({ gameId: game.id })
}
