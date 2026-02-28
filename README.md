# Voice to MIDI

A web application that converts voice/audio input into MIDI output. Sing or hum into your microphone and get MIDI notes on a piano roll, ready to export.

## Features

- **Voice Recording**: Capture pitch from microphone input using real-time audio analysis
- **Smart Audio Filtering**: Multi-layer noise rejection (bandpass filter, noise gate, pitch clarity threshold, frequency gate, and hysteresis) to isolate lead vocals and reject background noise
- **Min Note Duration**: Configurable minimum note length (in beats) via the top bar — filters out tiny artifact notes. Lower values (0.05) capture fast passages; higher values (0.5+) produce cleaner output
- **Piano Roll Editor**: Visual grid editor for viewing, adding, editing, and deleting MIDI notes
- **Timeline Ruler**: Click-to-seek playback cursor with bar/beat markers
- **Playback**: Listen back with selectable instrument presets (Piano, Synth, Strings)
- **MIDI Export**: Download your notes as a standard MIDI file
- **Multi-select**: Rubber-band selection, shift-click, and group move/resize
- **Undo/Redo**: Full history support for all editing operations
- **Copy/Cut/Paste**: Clipboard operations for selected notes

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Stop |
| Enter | Return cursor to start |
| R | Start / Stop recording |
| Delete / Backspace | Delete selected notes |
| Arrow Keys | Nudge selected notes |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + A | Select all |
| Ctrl/Cmd + C / X / V | Copy / Cut / Paste |

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Install and Run

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

## Tech Stack

- React
- Vite
- Tone.js (audio synthesis and transport)
- Zustand (state management)
- Canvas API (piano roll and timeline rendering)
