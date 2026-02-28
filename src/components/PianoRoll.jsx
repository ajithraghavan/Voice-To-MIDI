import { useRef, useEffect, useCallback, useState } from 'react';
import useNoteStore from '../stores/useNoteStore';
import {
  MIN_MIDI, MAX_MIDI, TOTAL_KEYS, KEY_HEIGHT, PIXELS_PER_BEAT, isBlackKey,
} from '../utils/noteHelpers';

const GRID_SUBDIVISION = 4; // 16th notes

export default function PianoRoll({ onScroll }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const notes = useNoteStore((s) => s.notes);
  const playbackPosition = useNoteStore((s) => s.playbackPosition);
  const selectedNoteIds = useNoteStore((s) => s.selectedNoteIds);
  const [dragState, setDragState] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const didDragRef = useRef(false);

  const getTotalBeats = useCallback(() => {
    if (notes.length === 0) return 16;
    const maxBeat = Math.max(...notes.map((n) => n.startTime + n.duration));
    return Math.max(16, Math.ceil(maxBeat) + 4);
  }, [notes]);

  // Convert canvas coords to grid coords
  const canvasToGrid = useCallback((x, y) => {
    const beat = x / PIXELS_PER_BEAT;
    const midi = MAX_MIDI - Math.floor(y / KEY_HEIGHT);
    return { beat, midi };
  }, []);

  // Find note at position
  const noteAtPosition = useCallback((beat, midi) => {
    return notes.find(
      (n) =>
        n.midi === midi &&
        beat >= n.startTime &&
        beat <= n.startTime + n.duration
    );
  }, [notes]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const totalBeats = getTotalBeats();
    const width = totalBeats * PIXELS_PER_BEAT;
    const height = TOTAL_KEYS * KEY_HEIGHT;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const selectedSet = new Set(selectedNoteIds);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Row backgrounds
    for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
      const y = (MAX_MIDI - midi) * KEY_HEIGHT;
      if (isBlackKey(midi)) {
        ctx.fillStyle = '#1e1e1e';
      } else {
        ctx.fillStyle = '#252525';
      }
      ctx.fillRect(0, y, width, KEY_HEIGHT);
    }

    // Grid lines - vertical (beats)
    for (let b = 0; b <= totalBeats; b++) {
      const x = b * PIXELS_PER_BEAT;
      ctx.strokeStyle = b % 4 === 0 ? '#555' : '#333';
      ctx.lineWidth = b % 4 === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Subdivisions
      for (let s = 1; s < GRID_SUBDIVISION; s++) {
        const sx = x + (s * PIXELS_PER_BEAT) / GRID_SUBDIVISION;
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }
    }

    // Grid lines - horizontal
    for (let i = 0; i <= TOTAL_KEYS; i++) {
      const y = i * KEY_HEIGHT;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw notes
    notes.forEach((note) => {
      const x = note.startTime * PIXELS_PER_BEAT;
      const y = (MAX_MIDI - note.midi) * KEY_HEIGHT;
      const w = note.duration * PIXELS_PER_BEAT;
      const isSelected = selectedSet.has(note.id);
      const isDragging = dragState?.noteId === note.id;

      // Note body — muted teal
      ctx.fillStyle = isSelected ? '#5a9a8a' : isDragging ? '#4a8a7a' : '#3d7a6a';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, Math.max(w - 2, 4), KEY_HEIGHT - 2, 2);
      ctx.fill();

      // Note border
      ctx.strokeStyle = isSelected ? '#8ac0b0' : '#5a9a8a';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, Math.max(w - 2, 4), KEY_HEIGHT - 2, 2);
      ctx.stroke();

      // Resize handle (right edge)
      ctx.fillStyle = '#7ab0a0';
      ctx.fillRect(x + w - 5, y + 1, 4, KEY_HEIGHT - 2);
    });

    // Playback cursor
    if (playbackPosition > 0) {
      const cx = playbackPosition * PIXELS_PER_BEAT;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
    }

    // Rubber-band selection rectangle
    if (selectionRect) {
      const rx = Math.min(selectionRect.startX, selectionRect.endX);
      const ry = Math.min(selectionRect.startY, selectionRect.endY);
      const rw = Math.abs(selectionRect.endX - selectionRect.startX);
      const rh = Math.abs(selectionRect.endY - selectionRect.startY);

      ctx.fillStyle = 'rgba(255, 122, 0, 0.12)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(255, 122, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }, [notes, playbackPosition, getTotalBeats, dragState, selectedNoteIds, selectionRect]);

  // Auto-scroll to follow playback
  useEffect(() => {
    if (playbackPosition > 0 && containerRef.current) {
      const cx = playbackPosition * PIXELS_PER_BEAT;
      const container = containerRef.current;
      const visible = container.clientWidth;
      if (cx > container.scrollLeft + visible - 100 || cx < container.scrollLeft) {
        container.scrollLeft = cx - 100;
      }
    }
  }, [playbackPosition]);

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { beat, midi } = canvasToGrid(x, y);

    if (midi < MIN_MIDI || midi > MAX_MIDI) return;

    const note = noteAtPosition(beat, midi);

    didDragRef.current = false;

    if (note) {
      const noteEndX = (note.startTime + note.duration) * PIXELS_PER_BEAT;
      const isResizeHandle = x >= noteEndX - 8;

      if (isResizeHandle) {
        useNoteStore.getState().pushHistory();
        setDragState({
          type: 'resize',
          noteId: note.id,
          startX: x,
          origDuration: note.duration,
        });
        // Select only this note for resize
        useNoteStore.getState().selectNotes([note.id]);
      } else if (e.shiftKey) {
        // Shift+click: toggle selection
        useNoteStore.getState().toggleNoteSelection(note.id);
      } else {
        const currentSelection = useNoteStore.getState().selectedNoteIds;
        const isAlreadySelected = currentSelection.includes(note.id);

        if (isAlreadySelected) {
          // Clicked note is already selected — start group move, keep selection
          useNoteStore.getState().pushHistory();
          const allNotes = useNoteStore.getState().notes;
          const selectedSet = new Set(currentSelection);
          const origPositions = {};
          allNotes.forEach((n) => {
            if (selectedSet.has(n.id)) {
              origPositions[n.id] = { startTime: n.startTime, midi: n.midi };
            }
          });
          setDragState({
            type: 'move',
            noteId: note.id,
            startX: x,
            startY: y,
            origPositions,
          });
        } else {
          // Clicked note is NOT selected — select only it, start single move
          useNoteStore.getState().pushHistory();
          useNoteStore.getState().selectNotes([note.id]);
          setDragState({
            type: 'move',
            noteId: note.id,
            startX: x,
            startY: y,
            origPositions: {
              [note.id]: { startTime: note.startTime, midi: note.midi },
            },
          });
        }
        setCursorStyle('grabbing');
      }
    } else {
      // Click on empty space
      if (e.shiftKey) {
        // Shift+click on empty: start rubber-band without clearing selection
        setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
        setDragState({ type: 'rubberband' });
      } else {
        // Normal click on empty: start rubber-band (will add note if no drag)
        useNoteStore.getState().clearSelection();
        setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
        setDragState({ type: 'rubberband' });
      }
    }
  }, [canvasToGrid, noteAtPosition]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Cursor feedback when not dragging
    if (!dragState) {
      const { beat, midi } = canvasToGrid(x, y);
      const note = noteAtPosition(beat, midi);
      if (note) {
        const noteEndX = (note.startTime + note.duration) * PIXELS_PER_BEAT;
        setCursorStyle(x >= noteEndX - 8 ? 'ew-resize' : 'grab');
      } else {
        setCursorStyle('crosshair');
      }
      return;
    }

    if (dragState.type === 'rubberband') {
      didDragRef.current = true;
      setSelectionRect((prev) => prev ? { ...prev, endX: x, endY: y } : null);
      return;
    }

    if (dragState.type === 'resize') {
      didDragRef.current = true;
      const deltaBeat = (x - dragState.startX) / PIXELS_PER_BEAT;
      const newDuration = Math.max(
        1 / GRID_SUBDIVISION,
        Math.round((dragState.origDuration + deltaBeat) * GRID_SUBDIVISION) / GRID_SUBDIVISION
      );
      useNoteStore.getState().updateNote(dragState.noteId, { duration: newDuration });
    } else if (dragState.type === 'move') {
      didDragRef.current = true;
      const deltaBeat = (x - dragState.startX) / PIXELS_PER_BEAT;
      const deltaMidi = -Math.round((y - dragState.startY) / KEY_HEIGHT);
      const snappedDeltaBeat = Math.round(deltaBeat * GRID_SUBDIVISION) / GRID_SUBDIVISION;

      // Apply delta to all selected notes using stored original positions
      const { notes: allNotes } = useNoteStore.getState();
      const origPositions = dragState.origPositions;

      const updatedNotes = allNotes.map((n) => {
        if (!origPositions[n.id]) return n;
        const orig = origPositions[n.id];
        const newStart = Math.max(0, orig.startTime + snappedDeltaBeat);
        const newMidi = Math.min(MAX_MIDI, Math.max(MIN_MIDI, orig.midi + deltaMidi));
        return { ...n, startTime: newStart, midi: newMidi };
      });

      useNoteStore.getState().setNotes(updatedNotes);
    }
  }, [dragState, canvasToGrid, noteAtPosition]);

  const handleMouseUp = useCallback((e) => {
    if (dragState?.type === 'rubberband' && selectionRect) {
      if (didDragRef.current) {
        // Rubber-band drag completed — select notes inside the rect
        const rx1 = Math.min(selectionRect.startX, selectionRect.endX);
        const ry1 = Math.min(selectionRect.startY, selectionRect.endY);
        const rx2 = Math.max(selectionRect.startX, selectionRect.endX);
        const ry2 = Math.max(selectionRect.startY, selectionRect.endY);

        const hitIds = notes
          .filter((note) => {
            const nx = note.startTime * PIXELS_PER_BEAT;
            const ny = (MAX_MIDI - note.midi) * KEY_HEIGHT;
            const nw = note.duration * PIXELS_PER_BEAT;
            const nh = KEY_HEIGHT;
            // Check rectangle intersection
            return nx + nw > rx1 && nx < rx2 && ny + nh > ry1 && ny < ry2;
          })
          .map((n) => n.id);

        if (e.shiftKey) {
          // Shift+rubberband: add to existing selection
          const existing = new Set(useNoteStore.getState().selectedNoteIds);
          hitIds.forEach((id) => existing.add(id));
          useNoteStore.getState().selectNotes([...existing]);
        } else {
          useNoteStore.getState().selectNotes(hitIds);
        }
      } else {
        // Click on empty space without dragging — add a new note
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { beat, midi } = canvasToGrid(x, y);
        if (midi >= MIN_MIDI && midi <= MAX_MIDI) {
          const snapBeat = Math.floor(beat * GRID_SUBDIVISION) / GRID_SUBDIVISION;
          useNoteStore.getState().addNote({
            midi,
            startTime: snapBeat,
            duration: 1 / GRID_SUBDIVISION,
            velocity: 100,
          });
        }
      }
      setSelectionRect(null);
    }

    if (dragState?.type === 'move') {
      setCursorStyle('grab');
    }

    setDragState(null);
  }, [dragState, selectionRect, notes, canvasToGrid]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { beat, midi } = canvasToGrid(x, y);
    const note = noteAtPosition(beat, midi);
    if (note) {
      useNoteStore.getState().deleteNote(note.id);
    }
  }, [canvasToGrid, noteAtPosition]);

  // Arrow key nudging
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { selectedNoteIds, notes: allNotes, updateNotes } = useNoteStore.getState();
      if (selectedNoteIds.length === 0) return;

      const step = 1 / GRID_SUBDIVISION;
      let delta = null;

      switch (e.key) {
        case 'ArrowLeft':
          delta = { startTime: -step };
          break;
        case 'ArrowRight':
          delta = { startTime: step };
          break;
        case 'ArrowUp':
          delta = { midi: 1 };
          break;
        case 'ArrowDown':
          delta = { midi: -1 };
          break;
        default:
          return;
      }

      e.preventDefault();
      useNoteStore.getState().pushHistory();

      // Clamp check before applying
      const selected = allNotes.filter((n) => selectedNoteIds.includes(n.id));
      if (delta.startTime !== undefined) {
        const minStart = Math.min(...selected.map((n) => n.startTime));
        if (minStart + delta.startTime < 0) return;
      }
      if (delta.midi !== undefined) {
        const midiValues = selected.map((n) => n.midi);
        if (delta.midi > 0 && Math.max(...midiValues) + delta.midi > MAX_MIDI) return;
        if (delta.midi < 0 && Math.min(...midiValues) + delta.midi < MIN_MIDI) return;
      }

      updateNotes(selectedNoteIds, delta);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="piano-roll-container" ref={containerRef} onScroll={onScroll}>
      <canvas
        ref={canvasRef}
        className="piano-roll-canvas"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
