import { useEffect } from 'react';
import useNoteStore from '../stores/useNoteStore';
import useRecorder from './useRecorder';
import usePlayback from './usePlayback';

export default function useKeyboardShortcuts() {
  const { startRecording, stopRecording } = useRecorder();
  const { startPlayback, stopPlayback } = usePlayback();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;
      const state = useNoteStore.getState();

      if (key === 'r' && !mod) {
        if (state.isRecording) {
          stopRecording();
        } else {
          if (state.isPlaying) stopPlayback();
          startRecording();
        }
      }

      if (key === ' ') {
        e.preventDefault();
        if (state.isPlaying) {
          stopPlayback();
        } else {
          if (state.isRecording) stopRecording();
          if (state.notes.length > 0) startPlayback();
        }
      }

      // Enter — return cursor to start (like GarageBand)
      if (key === 'enter') {
        e.preventDefault();
        if (state.isPlaying) stopPlayback();
        state.setPlaybackPosition(0);
      }

      // Delete / Backspace — delete all selected notes
      if (key === 'delete' || key === 'backspace') {
        if (state.selectedNoteIds.length > 0) {
          state.deleteSelected();
        }
      }

      // Ctrl/Cmd+C — copy selected
      if (key === 'c' && mod) {
        e.preventDefault();
        state.copySelected();
      }

      // Ctrl/Cmd+X — cut selected
      if (key === 'x' && mod) {
        e.preventDefault();
        state.cutSelected();
      }

      // Ctrl/Cmd+V — paste clipboard
      if (key === 'v' && mod) {
        e.preventDefault();
        const atBeat = state.playbackPosition || 0;
        state.pasteClipboard(atBeat);
      }

      // Ctrl/Cmd+Z — undo
      if (key === 'z' && mod && !e.shiftKey) {
        e.preventDefault();
        state.undo();
      }

      // Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y — redo
      if ((key === 'z' && mod && e.shiftKey) || (key === 'y' && mod)) {
        e.preventDefault();
        state.redo();
      }

      // Ctrl/Cmd+A — select all notes
      if (key === 'a' && mod) {
        e.preventDefault();
        const allIds = state.notes.map((n) => n.id);
        state.selectNotes(allIds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startRecording, stopRecording, startPlayback, stopPlayback]);
}
