import { useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import useNoteStore from '../stores/useNoteStore';
import { createInstrument } from '../utils/presets';
import { midiToNoteName, beatsToSeconds } from '../utils/noteHelpers';

export default function usePlayback() {
  const instrumentRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  const selectedPreset = useNoteStore((s) => s.selectedPreset);

  // Recreate instrument when preset changes
  useEffect(() => {
    if (instrumentRef.current) {
      instrumentRef.current.dispose();
    }
    instrumentRef.current = createInstrument(selectedPreset);
  }, [selectedPreset]);

  const startPlayback = useCallback(async () => {
    await Tone.start();
    const { notes, tempo, playbackPosition, setPlaying, setPlaybackPosition } = useNoteStore.getState();

    if (notes.length === 0) return;

    const instrument = instrumentRef.current;
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
    startTimeRef.current = performance.now();

    // Update playback cursor
    const updateCursor = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const { tempo: currentTempo } = useNoteStore.getState();
      const beat = startBeat + (elapsed * currentTempo) / 60;

      const maxBeat = Math.max(...notes.map((n) => n.startTime + n.duration));
      if (beat > maxBeat + 1) {
        stopPlayback();
        return;
      }

      setPlaybackPosition(beat);
      rafRef.current = requestAnimationFrame(updateCursor);
    };
    updateCursor();
  }, []);

  const stopPlayback = useCallback(() => {
    const { setPlaying, setPlaybackPosition } = useNoteStore.getState();
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setPlaybackPosition(0);
  }, []);

  return { startPlayback, stopPlayback };
}
