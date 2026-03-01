import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Button,
  Menu,
  Wrap,
  createToaster,
  Toaster,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastCloseTrigger,
  ToastIndicator,
} from '@chakra-ui/react';
import { useNavigate } from '@remix-run/react';
import { useContext } from 'react';
import { GiFalling, GiHamburgerMenu } from 'react-icons/gi';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { MdFileDownload, MdLogout } from 'react-icons/md';
import { SiLichess } from 'react-icons/si';

import { ExploreButton } from './explore-button';
import { RecordButton } from './record-button';
import { TrainButton } from './train-button';
import { GameContext } from '../with-game';

const toaster = createToaster({
  placement: 'top',
  duration: 3000,
});

export function LCMenu() {
  const { reset, soundEnabled, toggleSound, fen, orientation, moves } =
    useContext(GameContext);
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

  async function exportPGN() {
    toaster.create({
      title: 'Exporting PGN',
      description: 'Download will start shortly...',
      type: 'success',
    });
    const res = await fetch('/api/moves/export-pgn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, orientation, moves: moves.map((m) => m.lan) }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repertoire.pgn';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Wrap justify="center" gap={2} width="100%">
      <Toaster toaster={toaster}>
        {(toast) => (
          <ToastRoot maxW="sm">
            <ToastIndicator />
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
            <ToastCloseTrigger />
          </ToastRoot>
        )}
      </Toaster>
      <ExploreButton reset={true} />
      <TrainButton reset={true} />
      <Button variant="outline" onClick={anki} fontSize="md" flexShrink={0}>
        <GiFalling />
        Review mistakes
      </Button>
      <RecordButton reset={true} />
      <Button variant="outline" onClick={lichessReport} fontSize="md" flexShrink={0}>
        <SiLichess />
        lichess report
      </Button>
      <Menu.Root positioning={{ placement: 'bottom-end' }}>
        <Menu.Trigger asChild>
          <Button variant="outline" fontSize="md" flexShrink={0}>
            <GiHamburgerMenu />
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="sound" onClick={toggleSound}>
              {soundEnabled ? <HiOutlineSpeakerXMark /> : <HiOutlineSpeakerWave />}
              <Menu.ItemText>{soundEnabled ? 'Disable sound' : 'Enable sound'}</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="export-pgn" onClick={exportPGN}>
              <MdFileDownload />
              <Menu.ItemText>Export PGN from here</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="lichess-login" onClick={lichessLogin}>
              <SiLichess />
              <Menu.ItemText>Lichess login</Menu.ItemText>
            </Menu.Item>
            <Menu.Item value="logout" onClick={signOut}>
              <MdLogout />
              <Menu.ItemText>Logout</Menu.ItemText>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    </Wrap>
  );
}
