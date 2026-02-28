import useNoteStore from '../stores/useNoteStore';
import useMidiExport from '../hooks/useMidiExport';
import useRecorder from '../hooks/useRecorder';
import usePlayback from '../hooks/usePlayback';
import { PRESET_NAMES } from '../utils/presets';

export default function TopBar() {
  const isRecording = useNoteStore((s) => s.isRecording);
  const isPlaying = useNoteStore((s) => s.isPlaying);
  const tempo = useNoteStore((s) => s.tempo);
  const notes = useNoteStore((s) => s.notes);
  const minNoteDuration = useNoteStore((s) => s.minNoteDuration);
  const selectedPreset = useNoteStore((s) => s.selectedPreset);
  const { exportMidi } = useMidiExport();
  const { startRecording, stopRecording } = useRecorder();
  const { startPlayback, stopPlayback } = usePlayback();

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (isPlaying) stopPlayback();
      startRecording();
    }
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (isRecording) stopRecording();
      startPlayback();
    }
  };

  const handleStop = () => {
    if (isRecording) stopRecording();
    if (isPlaying) stopPlayback();
  };

  const handleClear = () => {
    if (isRecording) stopRecording();
    if (isPlaying) stopPlayback();
    useNoteStore.getState().clearNotes();
  };

  return (
    <div className="top-bar">
      {/* Transport controls */}
      <div className="transport-section">
        <button
          className={`transport-btn record ${isRecording ? 'active' : ''}`}
          onClick={handleRecord}
          title="Record (R)"
        >
          <span className="record-dot" />
        </button>

        <button
          className={`transport-btn play ${isPlaying ? 'active' : ''}`}
          onClick={handlePlay}
          disabled={notes.length === 0 && !isPlaying}
          title="Play (Space)"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="transport-btn stop"
          onClick={handleStop}
          title="Stop"
        >
          ⏹
        </button>
      </div>

      <div className="divider" />

      {/* BPM and info */}
      <div className="info-section">
        <div className="bpm-display">
          <input
            type="number"
            min={40}
            max={240}
            value={tempo}
            onChange={(e) => useNoteStore.getState().setTempo(Number(e.target.value))}
          />
          <span>BPM</span>
        </div>
        <div className="bpm-display" title="Min note duration (beats) — filters out tiny notes">
          <input
            type="number"
            min={0.05}
            max={1}
            step={0.05}
            value={minNoteDuration}
            onChange={(e) => useNoteStore.getState().setMinNoteDuration(Number(e.target.value))}
          />
          <span>Min</span>
        </div>
        <span className="note-count">{notes.length} notes</span>
        {isRecording && <span className="status recording">REC</span>}
        {isPlaying && <span className="status playing">PLAY</span>}
      </div>

      <div className="top-bar-spacer" />

      {/* Right: instrument + export */}
      <div className="right-controls">
        <label className="preset-selector">
          <select
            value={selectedPreset}
            onChange={(e) => useNoteStore.getState().setPreset(e.target.value)}
          >
            {Object.entries(PRESET_NAMES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>

        <button
          className="clear-btn"
          onClick={handleClear}
          disabled={notes.length === 0}
          title="Clear all notes"
        >
          Clear
        </button>

        <button
          className="export-btn"
          onClick={exportMidi}
          disabled={notes.length === 0}
        >
          Export MIDI
        </button>
      </div>
    </div>
  );
}
