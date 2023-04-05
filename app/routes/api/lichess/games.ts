import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { LichessGameSchema, LICHESS_USERNAME } from '~/schemas/lichess'

const LICHESS_TOKEN = process.env.LICHESS_TOKEN
const GAMES_COUNT = 20

export const loader: LoaderFunction = async () => {
  const headers = {
    Authorization: `Bearer ${LICHESS_TOKEN}`,
    Accept: 'application/x-ndjson',
  }

  const url =
    `https://lichess.org/api/games/user/${LICHESS_USERNAME}?` +
    new URLSearchParams({
      max: GAMES_COUNT.toString(),
      opening: 'true',
      ongoing: 'false',
    })

  const apiRes = await fetch(url, { headers })
  const data = (await apiRes.text()).split('\n').filter(Boolean)
  const rawJSON = data.map((d) => JSON.parse(d))
  try {
    const parsed = LichessGameSchema.array().parse(rawJSON)
    return json(parsed)
  } catch {
    console.error(rawJSON)
    return json([], { status: 500 })
  }
}
