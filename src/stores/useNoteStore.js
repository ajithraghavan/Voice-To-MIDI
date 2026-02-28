import { create } from 'zustand';

let nextId = 1;

const MAX_HISTORY = 50;

const useNoteStore = create((set, get) => ({
  notes: [],
  tempo: 120,
  minNoteDuration: 0.2,
  selectedPreset: 'piano',
  isRecording: false,
  isPlaying: false,
  playbackPosition: 0, // in beats
  selectedNoteIds: [],
  highlightedMidi: null,
  clipboard: [],
  _history: [],
  _historyIndex: -1,

  pushHistory: () => {
    const { notes, _history, _historyIndex } = get();
    const snapshot = { notes: notes.map((n) => ({ ...n })), nextId };
    const truncated = _history.slice(0, _historyIndex + 1);
    truncated.push(snapshot);
    if (truncated.length > MAX_HISTORY) truncated.shift();
    set({ _history: truncated, _historyIndex: truncated.length - 1 });
  },

  undo: () => {
    const { _history, _historyIndex, notes } = get();
    if (_historyIndex < 0) return;
    const snapshot = _history[_historyIndex];
    // Save current state as redo entry
    const newHistory = [..._history];
    if (_historyIndex + 1 < newHistory.length) {
      newHistory[_historyIndex + 1] = { notes: notes.map((n) => ({ ...n })), nextId };
    } else {
      newHistory.push({ notes: notes.map((n) => ({ ...n })), nextId });
    }
    nextId = snapshot.nextId;
    set({ notes: snapshot.notes, _history: newHistory, _historyIndex: _historyIndex - 1 });
  },

  redo: () => {
    const { _history, _historyIndex } = get();
    if (_historyIndex + 1 >= _history.length) return;
    const snapshot = _history[_historyIndex + 1];
    nextId = snapshot.nextId;
    set({ notes: snapshot.notes, _historyIndex: _historyIndex + 1 });
  },

  setNotes: (notes) => set({ notes }),

  addNote: (note) => {
    get().pushHistory();
    set((state) => ({
      notes: [...state.notes, { ...note, id: nextId++ }],
    }));
  },

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  updateNotes: (ids, deltaUpdates) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        notes: state.notes.map((n) => {
          if (!idSet.has(n.id)) return n;
          const updated = { ...n };
          if (deltaUpdates.startTime !== undefined) updated.startTime = n.startTime + deltaUpdates.startTime;
          if (deltaUpdates.midi !== undefined) updated.midi = n.midi + deltaUpdates.midi;
          return updated;
        }),
      };
    }),

  deleteNote: (id) => {
    get().pushHistory();
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteIds: state.selectedNoteIds.filter((nid) => nid !== id),
    }));
  },

  clearNotes: () => {
    get().pushHistory();
    set({ notes: [], selectedNoteIds: [] });
  },

  setPreset: (preset) => set({ selectedPreset: preset }),

  setTempo: (tempo) => set({ tempo }),

  setMinNoteDuration: (d) => set({ minNoteDuration: d }),

  setRecording: (isRecording) => set({ isRecording }),

  setPlaying: (isPlaying) => set({ isPlaying }),

  setPlaybackPosition: (pos) => set({ playbackPosition: pos }),

  // Multi-select actions
  selectNotes: (ids) => set({ selectedNoteIds: ids }),

  toggleNoteSelection: (id) =>
    set((state) => {
      const s = new Set(state.selectedNoteIds);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return { selectedNoteIds: [...s] };
    }),

  clearSelection: () => set({ selectedNoteIds: [] }),

  setHighlightedMidi: (midi) => set({ highlightedMidi: midi }),

  // Clipboard actions
  copySelected: () => {
    const { notes, selectedNoteIds } = get();
    if (selectedNoteIds.length === 0) return;
    const selected = notes.filter((n) => selectedNoteIds.includes(n.id));
    const minStart = Math.min(...selected.map((n) => n.startTime));
    const clipboard = selected.map((n) => ({
      midi: n.midi,
      startTime: n.startTime - minStart,
      duration: n.duration,
      velocity: n.velocity,
    }));
    set({ clipboard });
  },

  cutSelected: () => {
    const { copySelected, deleteSelected } = get();
    copySelected();
    get().pushHistory();
    deleteSelected();
  },

  deleteSelected: () =>
    set((state) => {
      const idSet = new Set(state.selectedNoteIds);
      return {
        notes: state.notes.filter((n) => !idSet.has(n.id)),
        selectedNoteIds: [],
      };
    }),

  pasteClipboard: (atBeat) => {
    get().pushHistory();
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    const newIds = [];
    const newNotes = clipboard.map((n) => {
      const id = nextId++;
      newIds.push(id);
      return { ...n, startTime: n.startTime + atBeat, id };
    });
    set((state) => ({
      notes: [...state.notes, ...newNotes],
      selectedNoteIds: newIds,
    }));
  },

  // Keep backward compat for any code using selectNote
  selectNote: (id) => set({ selectedNoteIds: id != null ? [id] : [] }),
}));

export default useNoteStore;
