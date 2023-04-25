import { Text, Link, Wrap } from '@chakra-ui/react';
import { BsGithub } from 'react-icons/bs';

export function Footer() {
  return (
    <Wrap align="center">
      <Text>&copy; {new Date().getFullYear()}</Text>
      <Link href="mailto:mail@aurelien-herve.com">Aurélien Hervé</Link>
      <Link href="https://github.com/aherve/le-cahier" isExternal={true}>
        <BsGithub />
      </Link>
    </Wrap>
  );
}
