import { useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import useNoteStore from '../stores/useNoteStore';
import { createInstrument } from '../utils/presets';
import { midiToNoteName, beatsToSeconds } from '../utils/noteHelpers';

// Module-level state so all callers share the same playback session
let instrument = null;
let raf = null;
let startTime = null;

export default function usePlayback() {
  const selectedPreset = useNoteStore((s) => s.selectedPreset);

  // Recreate instrument when preset changes
  useEffect(() => {
    if (instrument) {
      instrument.dispose();
    }
    instrument = createInstrument(selectedPreset);
  }, [selectedPreset]);

  const startPlayback = useCallback(async () => {
    await Tone.start();
    const { notes, tempo, playbackPosition, setPlaying, setPlaybackPosition } = useNoteStore.getState();

    if (notes.length === 0) return;

    if (!instrument) return;

    const startBeat = playbackPosition;

    Tone.getTransport().cancel();
    Tone.getTransport().bpm.value = tempo;
    Tone.getTransport().position = beatsToSeconds(startBeat, tempo);

    // Schedule notes at or after the start beat
    notes.forEach((note) => {
      if (note.startTime + note.duration <= startBeat) return;
      const startSec = beatsToSeconds(note.startTime, tempo);
      const durSec = beatsToSeconds(note.duration, tempo);
      const noteName = midiToNoteName(note.midi);

      Tone.getTransport().schedule((time) => {
        instrument.triggerAttackRelease(noteName, durSec, time, note.velocity / 127);
      }, startSec);
    });

    setPlaying(true);
    Tone.getTransport().start();
    startTime = performance.now();

    // Update playback cursor
    const updateCursor = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const { tempo: currentTempo } = useNoteStore.getState();
      const beat = startBeat + (elapsed * currentTempo) / 60;

      const maxBeat = Math.max(...notes.map((n) => n.startTime + n.duration));
      if (beat > maxBeat + 1) {
        stopPlayback();
        return;
      }

      setPlaybackPosition(beat);
      raf = requestAnimationFrame(updateCursor);
    };
    updateCursor();
  }, []);

  const stopPlayback = useCallback(() => {
    const { setPlaying, setPlaybackPosition } = useNoteStore.getState();
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (raf) cancelAnimationFrame(raf);
    setPlaying(false);
    setPlaybackPosition(0);
  }, []);

  return { startPlayback, stopPlayback };
}
