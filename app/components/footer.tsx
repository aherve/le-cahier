import { Flex, Link, Text } from '@chakra-ui/react';
import { BsGithub } from 'react-icons/bs';
import { MdOutlineEmail } from 'react-icons/md';

export function Footer() {
  return (
    <Flex
      align="center"
      wrap="wrap"
      gap={2}
      marginTop="5"
      justify="center"
      width="100%"
    >
      <Text flexShrink={0}>
        &copy; {new Date().getFullYear()} Aurélien Hervé
      </Text>
      <Link href="mailto:mail@aurelien-herve.com" flexShrink={0}>
        <MdOutlineEmail />
      </Link>
      <Link
        href="https://github.com/aherve/le-cahier"
        isExternal={true}
        flexShrink={0}
      >
        <BsGithub />
      </Link>
    </Flex>
  );
}
