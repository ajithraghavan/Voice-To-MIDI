import { useRef, useEffect, useCallback } from 'react';
import useNoteStore from '../stores/useNoteStore';
import { PIXELS_PER_BEAT } from '../utils/noteHelpers';

const TIMELINE_HEIGHT = 24;
const GRID_SUBDIVISION = 4;

export default function Timeline({ scrollLeft }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const notes = useNoteStore((s) => s.notes);
  const playbackPosition = useNoteStore((s) => s.playbackPosition);

  const getTotalBeats = useCallback(() => {
    if (notes.length === 0) return 16;
    const maxBeat = Math.max(...notes.map((n) => n.startTime + n.duration));
    return Math.max(16, Math.ceil(maxBeat) + 4);
  }, [notes]);

  // Sync scroll from PianoRoll
  useEffect(() => {
    if (containerRef.current != null && scrollLeft != null) {
      containerRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const totalBeats = getTotalBeats();
    const width = totalBeats * PIXELS_PER_BEAT;

    canvas.width = width;
    canvas.height = TIMELINE_HEIGHT;

    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, TIMELINE_HEIGHT);

    // Bottom border
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, TIMELINE_HEIGHT - 0.5);
    ctx.lineTo(width, TIMELINE_HEIGHT - 0.5);
    ctx.stroke();

    // Beat ticks and labels
    for (let b = 0; b <= totalBeats; b++) {
      const x = b * PIXELS_PER_BEAT;
      const isBar = b % 4 === 0;

      // Tick mark
      ctx.strokeStyle = isBar ? '#666' : '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, isBar ? 4 : 12);
      ctx.lineTo(x, TIMELINE_HEIGHT);
      ctx.stroke();

      // Bar numbers (every 4 beats)
      if (isBar) {
        ctx.fillStyle = '#999';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(String(b / 4 + 1), x + 3, 14);
      }
    }

    // Playback cursor
    if (playbackPosition >= 0) {
      const cx = playbackPosition * PIXELS_PER_BEAT;
      // Red triangle marker
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(cx - 4, 0);
      ctx.lineTo(cx + 4, 0);
      ctx.lineTo(cx, 8);
      ctx.closePath();
      ctx.fill();

      // Red line
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, TIMELINE_HEIGHT);
      ctx.stroke();
    }
  }, [notes, playbackPosition, getTotalBeats]);

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const beat = x / PIXELS_PER_BEAT;
    const snapped = Math.round(beat * GRID_SUBDIVISION) / GRID_SUBDIVISION;
    useNoteStore.getState().setPlaybackPosition(Math.max(0, snapped));
  }, []);

  return (
    <div className="timeline-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="timeline-canvas"
        height={TIMELINE_HEIGHT}
        onClick={handleClick}
      />
    </div>
  );
}
