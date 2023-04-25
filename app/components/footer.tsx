import { Text, Link, Wrap } from '@chakra-ui/react';
import { BsGithub } from 'react-icons/bs';
import { MdOutlineEmail } from 'react-icons/md';

export function Footer() {
  return (
    <Wrap align="center">
      <Text>&copy; {new Date().getFullYear()} Aurélien Hervé</Text>
      <Link href="mailto:mail@aurelien-herve.com">
        <MdOutlineEmail />
      </Link>
      <Link href="https://github.com/aherve/le-cahier" isExternal={true}>
        <BsGithub />
      </Link>
    </Wrap>
  );
}
