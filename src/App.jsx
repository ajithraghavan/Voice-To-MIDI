import { useRef, useState, useCallback } from 'react';
import TopBar from './components/TopBar';
import Timeline from './components/Timeline';
import PianoRoll from './components/PianoRoll';
import PianoKeys from './components/PianoKeys';
import useNoteStore from './stores/useNoteStore';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import './styles/app.css';

export default function App() {
  useKeyboardShortcuts();
  const notes = useNoteStore((s) => s.notes);
  const keysRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleRollScroll = useCallback((e) => {
    if (keysRef.current) {
      keysRef.current.scrollTop = e.target.scrollTop;
    }
    setScrollLeft(e.target.scrollLeft);
  }, []);

  return (
    <>
      <TopBar />
      <div className="timeline-row">
        <div className="timeline-keys-spacer" />
        <Timeline scrollLeft={scrollLeft} />
      </div>
      <div className="piano-roll-wrapper">
        <PianoKeys ref={keysRef} />
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <PianoRoll onScroll={handleRollScroll} />
          {notes.length === 0 && (
            <div className="empty-hint">
              Click Record and sing or hum to capture notes<br />
              Or click on the grid to add notes manually
            </div>
          )}
        </div>
      </div>
    </>
  );
}
