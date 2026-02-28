const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function frequencyToMidi(freq) {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

export function midiToNoteName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function isBlackKey(midi) {
  const note = midi % 12;
  return [1, 3, 6, 8, 10].includes(note);
}

// Piano roll range
export const MIN_MIDI = 36; // C2
export const MAX_MIDI = 84; // C6
export const TOTAL_KEYS = MAX_MIDI - MIN_MIDI + 1;

// Timing
export const PIXELS_PER_BEAT = 80;
export const KEY_HEIGHT = 16;

export function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize;
}

export function beatsToSeconds(beats, bpm) {
  return (beats / bpm) * 60;
}

export function secondsToBeats(seconds, bpm) {
  return (seconds * bpm) / 60;
}
