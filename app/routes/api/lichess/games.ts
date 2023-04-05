import type { LoaderFunction } from '@remix-run/node'

const LICHESS_TOKEN = process.env.LICHESS_TOKEN
const USERNAME = 'MaximeCaVaChierGrave'

export const loader: LoaderFunction = async () => {
  const headers = {
    Authorization: `Bearer ${LICHESS_TOKEN}`,
    Accept: 'application/x-ndjson',
  }

  const url =
    `https://lichess.org/api/games/user/${USERNAME}?` +
    new URLSearchParams({
      max: '20',
      opening: 'true',
      ongoing: 'false',
    })

  const apiRes = await fetch(url, { headers })
  const data = (await apiRes.text()).split('\n').filter(Boolean)
}
