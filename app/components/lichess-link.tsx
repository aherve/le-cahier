import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Link } from '@chakra-ui/react'

export default function LichessLink(
  props: { fen: string } | { gameId: string; moveIndex?: number }
) {
  const link =
    'fen' in props
      ? encodeURI(`https://lichess.org/analysis/${props.fen}`)
      : `https://lichess.org/${props.gameId}#${props.moveIndex ?? 0}`
  return (
    <>
      <Link href={link} isExternal>
        view on lichess <ExternalLinkIcon mx="2px" />
      </Link>
    </>
  )
}
