import React from 'react';

const CHAPTERS = [
  { id: 'hero', label: 'Intro', years: '1975–2026', altitude: 'BRIEFING' },
  { id: 'lineage', label: 'Lineage', years: 'DNA Map', altitude: 'FL010' },
  { id: 'era-1', label: 'Era 01', years: '1979–1995', altitude: 'FL050' },
  { id: 'era-2', label: 'Era 02', years: '1996–2001', altitude: 'FL180' },
  { id: 'era-3', label: 'Era 03', years: '2001–2009', altitude: 'FL310' },
  { id: 'era-4', label: 'Era 04', years: '2009–2019', altitude: 'FL240' },
  { id: 'era-5', label: 'Era 05', years: '2020–2026', altitude: 'FL410' },
  { id: 'recovery-2024', label: '2024–26', years: '18 Updates', altitude: 'LIVE OPS' },
  { id: 'hardware-specs', label: 'Specs', years: '2,048× RAM', altitude: 'DATA' },
  { id: 'deep-dives', label: 'Essays', years: '3 Dives', altitude: 'ARCHIVE' },
  { id: 'trivia', label: 'Trivia', years: '15 Facts', altitude: 'LOGBOOK' },
];

export default function FlightDeckHUD({ activeSection, onJump }) {
  const current = CHAPTERS.find((c) => c.id === activeSection) || CHAPTERS[0];

  return (
    <nav className="flight-hud" aria-label="History chapters">
      <div className="flight-hud-card">
        <div className="flight-hud-telemetry">
          <span>{current.altitude}</span>
          <strong>{current.years}</strong>
        </div>
        {CHAPTERS.map((ch) => (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className={`flight-hud-btn ${activeSection === ch.id ? 'active' : ''}`}
            onClick={(event) => { event.preventDefault(); onJump(ch.id); }}
            aria-current={activeSection === ch.id ? 'location' : undefined}
            title={`${ch.label} (${ch.years})`}
          >
            <span>{ch.label}</span>
            <span className="flight-hud-dot" />
          </a>
        ))}
      </div>
    </nav>
  );
}
