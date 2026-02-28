import { useCallback } from 'react';
import MidiWriter from 'midi-writer-js';
import useNoteStore from '../stores/useNoteStore';
import { midiToNoteName } from '../utils/noteHelpers';

export default function useMidiExport() {
  const exportMidi = useCallback(() => {
    const { notes, tempo } = useNoteStore.getState();
    if (notes.length === 0) return;

    const track = new MidiWriter.Track();
    track.setTempo(tempo);

    // Sort notes by start time
    const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);

    sorted.forEach((note) => {
      // midi-writer-js uses ticks; 1 beat = 128 ticks
      const startTicks = Math.round(note.startTime * 128);
      const durationTicks = Math.max(1, Math.round(note.duration * 128));

      track.addEvent(
        new MidiWriter.NoteEvent({
          pitch: [note.midi],
          duration: `T${durationTicks}`,
          startTick: startTicks,
          velocity: note.velocity,
        })
      );
    });

    const writer = new MidiWriter.Writer([track]);
    const blob = new Blob([writer.buildFile()], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-to-midi.mid';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportMidi };
}
