import { useCallback } from 'react';
import { PitchDetector } from 'pitchy';
import useNoteStore from '../stores/useNoteStore';
import { frequencyToMidi, secondsToBeats } from '../utils/noteHelpers';

const CLARITY_THRESHOLD = 0.93;

const NOISE_GATE_DB = -26;
const HIGHPASS_FREQ = 80;
const LOWPASS_FREQ = 1200;
const MIN_FREQ = 80;
const MAX_FREQ = 1100;
const PITCH_STABILITY_FRAMES = 3;

// Module-level state so all callers share the same recording session
let stream = null;
let analyser = null;
let raf = null;
let currentNote = null;
let pendingNote = null;
let recordStart = null;
let startBeat = 0;
let audioCtx = null;

export default function useRecorder() {
  const startRecording = useCallback(async () => {
    const { setRecording, addNote, tempo, minNoteDuration, playbackPosition } = useNoteStore.getState();
    startBeat = playbackPosition;

    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = HIGHPASS_FREQ;
    highpass.Q.value = 0.7;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = LOWPASS_FREQ;
    lowpass.Q.value = 0.7;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(analyser);

    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    detector.minVolumeDecibels = NOISE_GATE_DB;
    const buffer = new Float32Array(analyser.fftSize);

    recordStart = performance.now();
    setRecording(true);

    const detect = () => {
      analyser.getFloatTimeDomainData(buffer);
      const [frequency, clarity] = detector.findPitch(buffer, audioCtx.sampleRate);

      const now = performance.now();
      const elapsedSec = (now - recordStart) / 1000;
      const currentBeat = startBeat + secondsToBeats(elapsedSec, tempo);

      if (clarity > CLARITY_THRESHOLD && frequency > MIN_FREQ && frequency < MAX_FREQ) {
        const midi = frequencyToMidi(frequency);

        if (currentNote && currentNote.midi === midi) {
          // Same note continues — clear any pending candidate
          pendingNote = null;
        } else {
          // Different note detected — apply hysteresis
          if (pendingNote && pendingNote.midi === midi) {
            pendingNote.framesHeld++;
            if (pendingNote.framesHeld >= PITCH_STABILITY_FRAMES) {
              // Candidate confirmed — end previous note and start new one
              if (currentNote) {
                const duration = currentBeat - currentNote.startTime;
                if (duration > minNoteDuration) {
                  addNote({
                    midi: currentNote.midi,
                    startTime: currentNote.startTime,
                    duration,
                    velocity: 100,
                  });
                }
              }
              currentNote = { midi, startTime: currentBeat };
              pendingNote = null;
            }
          } else {
            // New candidate — start tracking
            pendingNote = { midi, framesHeld: 1 };
          }
        }
      } else {
        // Silence — end current note and clear pending
        pendingNote = null;
        if (currentNote) {
          const duration = currentBeat - currentNote.startTime;
          if (duration > minNoteDuration) {
            addNote({
              midi: currentNote.midi,
              startTime: currentNote.startTime,
              duration,
              velocity: 100,
            });
          }
          currentNote = null;
        }
      }

      raf = requestAnimationFrame(detect);
    };

    detect();
  }, []);

  const stopRecording = useCallback(() => {
    const { setRecording, addNote, tempo, minNoteDuration } = useNoteStore.getState();

    // Finalize any in-progress note
    if (currentNote && recordStart) {
      const elapsedSec = (performance.now() - recordStart) / 1000;
      const currentBeat = startBeat + secondsToBeats(elapsedSec, tempo);
      const duration = currentBeat - currentNote.startTime;
      if (duration > minNoteDuration) {
        addNote({
          midi: currentNote.midi,
          startTime: currentNote.startTime,
          duration,
          velocity: 100,
        });
      }
      currentNote = null;
    }
    pendingNote = null;

    if (raf) cancelAnimationFrame(raf);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }

    setRecording(false);
  }, []);

  return { startRecording, stopRecording };
}
