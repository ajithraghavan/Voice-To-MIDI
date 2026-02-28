import { useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';
import useNoteStore from '../stores/useNoteStore';
import { frequencyToMidi, secondsToBeats } from '../utils/noteHelpers';

const CLARITY_THRESHOLD = 0.85;
const MIN_NOTE_DURATION = 0.05; // beats

export default function useRecorder() {
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const currentNoteRef = useRef(null);
  const recordStartRef = useRef(null);
  const audioCtxRef = useRef(null);

  const startRecording = useCallback(async () => {
    const { setRecording, addNote, tempo } = useNoteStore.getState();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    const buffer = new Float32Array(analyser.fftSize);

    recordStartRef.current = performance.now();
    setRecording(true);

    const detect = () => {
      analyser.getFloatTimeDomainData(buffer);
      const [frequency, clarity] = detector.findPitch(buffer, audioCtx.sampleRate);

      const now = performance.now();
      const elapsedSec = (now - recordStartRef.current) / 1000;
      const currentBeat = secondsToBeats(elapsedSec, tempo);

      if (clarity > CLARITY_THRESHOLD && frequency > 60 && frequency < 2000) {
        const midi = frequencyToMidi(frequency);
        const current = currentNoteRef.current;

        if (!current || current.midi !== midi) {
          // End previous note
          if (current) {
            const duration = currentBeat - current.startTime;
            if (duration > MIN_NOTE_DURATION) {
              addNote({
                midi: current.midi,
                startTime: current.startTime,
                duration,
                velocity: 100,
              });
            }
          }
          // Start new note
          currentNoteRef.current = { midi, startTime: currentBeat };
        }
      } else {
        // Silence — end current note
        if (currentNoteRef.current) {
          const duration = currentBeat - currentNoteRef.current.startTime;
          if (duration > MIN_NOTE_DURATION) {
            addNote({
              midi: currentNoteRef.current.midi,
              startTime: currentNoteRef.current.startTime,
              duration,
              velocity: 100,
            });
          }
          currentNoteRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, []);

  const stopRecording = useCallback(() => {
    const { setRecording, addNote, tempo } = useNoteStore.getState();

    // Finalize any in-progress note
    if (currentNoteRef.current && recordStartRef.current) {
      const elapsedSec = (performance.now() - recordStartRef.current) / 1000;
      const currentBeat = secondsToBeats(elapsedSec, tempo);
      const duration = currentBeat - currentNoteRef.current.startTime;
      if (duration > MIN_NOTE_DURATION) {
        addNote({
          midi: currentNoteRef.current.midi,
          startTime: currentNoteRef.current.startTime,
          duration,
          velocity: 100,
        });
      }
      currentNoteRef.current = null;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setRecording(false);
  }, []);

  return { startRecording, stopRecording };
}
