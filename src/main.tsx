import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { sound } from './game/sound.ts';

// Top-level global unlock listener: proactively unlock the Web Audio API context on first user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sound.unlock().catch(() => {});
    ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) =>
      window.removeEventListener(evt, unlockAudio, true)
    );
  };
  ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach((evt) =>
    window.addEventListener(evt, unlockAudio, { capture: true, passive: true })
  );
}

createRoot(document.getElementById('root')!).render(<App />);
