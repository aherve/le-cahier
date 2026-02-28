import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Button,
  Menu,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { GiFalling, GiHamburgerMenu } from 'react-icons/gi';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { MdLogout } from 'react-icons/md';
import { SiLichess } from 'react-icons/si';

import { ExploreButton } from './explore-button';
import { RecordButton } from './record-button';
import { TrainButton } from './train-button';
import { GameContext } from '../with-game';

export function LCMenu() {
  const { reset, soundEnabled, toggleSound } = useContext(GameContext);
  const { signOut } = useAuthenticator();
  const navigate = useNavigate();

  function anki() {
    reset();
    navigate('/anki');
  }
  function lichessReport() {
    navigate('/lichess-report');
  }

  function lichessLogin() {
    navigate('/lichess/login');
  }

  function ToggleSoundMenuItem() {
    if (soundEnabled) {
      return (
        <Wrap align="center">
          <HiOutlineSpeakerXMark /> <WrapItem>Disable sound</WrapItem>
        </Wrap>
      );
    } else {
      return (
        <Wrap align="center">
          <HiOutlineSpeakerWave /> <WrapItem>Enable sound</WrapItem>
        </Wrap>
      );
    }
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
          <Menu.Root positioning={{ placement: 'bottom-end' }}>
            <Menu.Trigger asChild>
              <Button variant="outline">
                <GiHamburgerMenu />
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item onClick={toggleSound}>
                  <ToggleSoundMenuItem />
                </Menu.Item>
                <Menu.Item onClick={lichessLogin}>
                  <Wrap align="center">
                    <SiLichess /> <WrapItem>Lichess login</WrapItem>
                  </Wrap>
                </Menu.Item>
                <Menu.Item onClick={signOut}>
                  <Wrap align="center">
                    <MdLogout /> <WrapItem>Logout</WrapItem>
                  </Wrap>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </WrapItem>
      </Wrap>
    </>
  );
}
