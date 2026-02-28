import useNoteStore from '../stores/useNoteStore';
import useRecorder from '../hooks/useRecorder';
import usePlayback from '../hooks/usePlayback';

export default function TransportBar() {
  const isRecording = useNoteStore((s) => s.isRecording);
  const isPlaying = useNoteStore((s) => s.isPlaying);
  const tempo = useNoteStore((s) => s.tempo);
  const notes = useNoteStore((s) => s.notes);

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
    <div className="transport-bar">
      <div className="transport-controls">
        <button
          className={`transport-btn record ${isRecording ? 'active' : ''}`}
          onClick={handleRecord}
          title="Record (R)"
        >
          <span className="record-dot" />
          {isRecording ? 'Stop Rec' : 'Record'} <kbd>R</kbd>
        </button>

        <button
          className={`transport-btn play ${isPlaying ? 'active' : ''}`}
          onClick={handlePlay}
          disabled={notes.length === 0}
          title="Play (Space)"
        >
          {isPlaying ? '⏸' : '▶'} {isPlaying ? 'Pause' : 'Play'} <kbd>Space</kbd>
        </button>

        <button
          className="transport-btn stop"
          onClick={handleStop}
          title="Stop"
        >
          ⏹ Stop
        </button>

        <button
          className="transport-btn clear"
          onClick={handleClear}
          disabled={notes.length === 0}
          title="Clear all notes"
        >
          Clear
        </button>
      </div>

      <div className="transport-info">
        <label className="tempo-control">
          BPM:
          <input
            type="number"
            min={40}
            max={240}
            value={tempo}
            onChange={(e) => useNoteStore.getState().setTempo(Number(e.target.value))}
          />
        </label>
        <span className="note-count">{notes.length} notes</span>
        {isRecording && <span className="status recording">● REC</span>}
        {isPlaying && <span className="status playing">▶ PLAYING</span>}
      </div>
    </div>
  );
}
