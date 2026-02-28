import { Link, Text, Wrap } from '@chakra-ui/react';
import { BsGithub } from 'react-icons/bs';
import { MdOutlineEmail } from 'react-icons/md';

export function Footer() {
  return (
    <Wrap align="center" gap={2} marginTop="5" justify="center" width="100%">
      <Text fontSize={{ base: "lg", md: "md" }}>&copy; {new Date().getFullYear()} Aurélien Hervé</Text>
      <Link href="mailto:mail@aurelien-herve.com" fontSize={{ base: "lg", md: "md" }}>
        <MdOutlineEmail />
      </Link>
      <Link href="https://github.com/aherve/le-cahier" isExternal={true} fontSize={{ base: "lg", md: "md" }}>
        <BsGithub />
      </Link>
    </Wrap>
  );
}
