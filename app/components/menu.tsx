import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
} from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { BsRecordCircle } from 'react-icons/bs';
import { GiFalling } from 'react-icons/gi';
import { MdOutlineSmartToy, MdSettings } from 'react-icons/md';
import { SiLichess } from 'react-icons/si';
import { VscBook } from 'react-icons/vsc';

import { GameContext } from '~/with-game';

export function LCMenu() {
  const { reset } = useContext(GameContext);
  const { signOut } = useAuthenticator();
  const navigate = useNavigate();

  function explore() {
    reset();
    navigate('/explore');
  }
  function train() {
    reset();
    navigate('/train');
  }
  function anki() {
    reset();
    navigate('/anki');
  }
  function record() {
    reset();
    navigate('/record');
  }
  function lichessReport() {
    navigate('/lichess-report');
  }
  function settings() {
    navigate('/settings');
  }

  return (
    <>
      <Flex direction="row" align="center" justifyContent="center" gap="5">
        <Button leftIcon={<VscBook />} onClick={explore}>
          Explore
        </Button>
        <Button leftIcon={<MdOutlineSmartToy />} onClick={train}>
          Train
        </Button>
        <Button onClick={anki} leftIcon={<GiFalling />}>
          Review mistakes
        </Button>
        <Button leftIcon={<BsRecordCircle />} onClick={record}>
          Record moves
        </Button>
        <Button leftIcon={<SiLichess />} onClick={lichessReport}>
          lichess report
        </Button>
        <Menu>
          <MenuButton as={Button}>
            <MdSettings />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={settings}>Settings</MenuItem>
            <MenuItem onClick={signOut}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      ;
    </>
  );
}
