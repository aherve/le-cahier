import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { GiFalling, GiHamburgerMenu } from 'react-icons/gi';
import { MdLogout, MdSettings } from 'react-icons/md';
import { SiLichess } from 'react-icons/si';

import { ExploreButton } from './explore-button';
import { RecordButton } from './record-button';
import { TrainButton } from './train-button';

import { GameContext } from '~/with-game';

export function LCMenu() {
  const { reset } = useContext(GameContext);
  const { signOut } = useAuthenticator();
  const navigate = useNavigate();

  function anki() {
    reset();
    navigate('/anki');
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
        <WrapItem>
          <ExploreButton reset={true} />
        </WrapItem>
        <WrapItem>
          <TrainButton reset={true} />
        </WrapItem>
        <WrapItem>
          <Button onClick={anki} leftIcon={<GiFalling />}>
            Review mistakes
          </Button>
        </WrapItem>

        <WrapItem>
          <RecordButton reset={true} />
        </WrapItem>

        <WrapItem>
          <Button leftIcon={<SiLichess />} onClick={lichessReport}>
            lichess report
          </Button>
        </WrapItem>

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
