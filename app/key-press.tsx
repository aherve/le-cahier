import { useEffect, useState } from 'react';

export function useKeyPress(targetKey: string): boolean {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState(false);
  // If pressed key is our target key then set to true

  // Add event listeners
  useEffect(() => {
    const downHandler = ({ key }: { key: string }): void => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };
    // If released key is our target key then set to false
    const upHandler = ({ key }: { key: string }): void => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };
    console.log('adding listener');
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    // Remove event listeners on cleanup
    return () => {
      console.log('removing listener');
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]); // Empty array ensures that effect is only run on mount and unmount
  return keyPressed;
}
