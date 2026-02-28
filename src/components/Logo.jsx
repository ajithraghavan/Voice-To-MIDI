export default function Logo({ size = 18 }) {
  return (
    <div className="logo" title="Voice To MIDI">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Microphone body — represents voice input */}
        <rect x="13" y="4" width="6" height="12" rx="3" fill="#ff7a00" />

        {/* Microphone arc */}
        <path
          d="M10 14a6 6 0 0 0 12 0"
          stroke="#ff7a00"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Mic stand becomes an arrow pointing right — voice to MIDI flow */}
        <line x1="16" y1="20" x2="16" y2="23" stroke="#ff7a00" strokeWidth="1.8" strokeLinecap="round" />

        {/* Small MIDI note at bottom right — represents output */}
        <circle cx="21" cy="27" r="2.2" fill="#b0b0b0" />
        <line x1="23.2" y1="27" x2="23.2" y2="21" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="23.2" y1="21" x2="26" y2="22" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" />

        {/* Flow arrow from mic to note */}
        <path
          d="M16 24.5 L18.5 27"
          stroke="#666"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="logo-text">
        <span className="logo-voice">Voice</span>
        <span className="logo-arrow">To</span>
        <span className="logo-midi">MIDI</span>
      </span>
    </div>
  );
}
