import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { BsRecordCircle } from 'react-icons/bs';
import { GiFalling, GiHamburgerMenu } from 'react-icons/gi';
import { MdLogout, MdOutlineSmartToy, MdSettings } from 'react-icons/md';
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
      <Wrap justify="center">
        <Spacer />
        <WrapItem>
          <Button leftIcon={<VscBook />} onClick={explore}>
            Explore
          </Button>
        </WrapItem>
        <WrapItem>
          <Button leftIcon={<MdOutlineSmartToy />} onClick={train}>
            Train
          </Button>
        </WrapItem>
        <WrapItem>
          <Button onClick={anki} leftIcon={<GiFalling />}>
            Review mistakes
          </Button>
        </WrapItem>

        <WrapItem>
          <Button leftIcon={<BsRecordCircle />} onClick={record}>
            Record moves
          </Button>
        </WrapItem>

        <WrapItem>
          <Button leftIcon={<SiLichess />} onClick={lichessReport}>
            lichess report
          </Button>
        </WrapItem>

        <Spacer />

        <WrapItem>
          <Menu>
            <MenuButton as={Button} variant="outline">
              <GiHamburgerMenu />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={settings}>
                <Wrap align="center">
                  <MdSettings /> <WrapItem>Settings</WrapItem>
                </Wrap>
              </MenuItem>
              <MenuItem onClick={signOut}>
                <Wrap align="center">
                  <MdLogout /> <WrapItem>Logout</WrapItem>
                </Wrap>
              </MenuItem>
            </MenuList>
          </Menu>
        </WrapItem>
      </Wrap>
    </>
  );
}
