import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link } from "@chakra-ui/react";

export default function LichessLink(props: { fen: string }) {
  const link = encodeURI(`https://lichess.org/analysis/${props.fen}`);
  return (
    <>
      <Link href={link} isExternal>
        Analyze on lichess <ExternalLinkIcon mx="2px" />
      </Link>
    </>
  );
}
