import { forwardRef } from 'react';
import { midiToNoteName, isBlackKey, MIN_MIDI, MAX_MIDI, KEY_HEIGHT } from '../utils/noteHelpers';
import useNoteStore from '../stores/useNoteStore';

const PianoKeys = forwardRef(function PianoKeys(props, ref) {
  const highlightedMidi = useNoteStore((s) => s.highlightedMidi);
  const keys = [];
  for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
    const name = midiToNoteName(midi);
    const black = isBlackKey(midi);
    const highlighted = midi === highlightedMidi;
    keys.push(
      <div
        key={midi}
        className={`piano-key ${black ? 'black' : 'white'}${highlighted ? ' highlighted' : ''}`}
        style={{ height: KEY_HEIGHT }}
      >
        <span className="key-label">{name}</span>
      </div>
    );
  }

  return <div className="piano-keys" ref={ref}>{keys}</div>;
});

export default PianoKeys;
