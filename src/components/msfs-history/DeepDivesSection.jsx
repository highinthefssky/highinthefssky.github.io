import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { DEEP_DIVES } from '../../data/msfsHistory';
import HistoryImage from './HistoryImage';

export default function DeepDivesSection({ onOpenLightbox }) {
  const [activeId, setActiveId] = useState(DEEP_DIVES[0].id);
  const current = DEEP_DIVES.find((d) => d.id === activeId) || DEEP_DIVES[0];

  return (
    <section id="deep-dives" tabIndex={-1} className="section-container">
      <div className="section-header">
        <div className="section-eyebrow">
          <Layers size={14} />
          <span>03 · Thematic Deep-Dives</span>
        </div>
        <h2 className="section-title">Inside the Architecture, Modding Culture &amp; FSX Legacy</h2>
        <p className="section-subtitle">
          Switch between three historical essays unpacking how Microsoft Flight Simulator
          pushed consumer computing, cultivated an unmatched creator economy, and survived a 14-year
          mainline hiatus.
        </p>
      </div>

      <div className="deepdive-tabs" role="group" aria-label="Thematic deep-dive essays">
        {DEEP_DIVES.map((dive) => (
          <button
            key={dive.id}
            type="button"
            aria-pressed={dive.id === activeId}
            className={`deepdive-tab ${dive.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(dive.id)}
          >
            <div className="deepdive-tab-eyebrow">{dive.eyebrow}</div>
            <div className="deepdive-tab-title">{dive.title}</div>
          </button>
        ))}
      </div>

      <article className="deepdive-panel" aria-labelledby="history-essay-title">
        <button
          type="button"
          className="deepdive-media"
          aria-label={`View image: ${current.title}`}
          onClick={() =>
            onOpenLightbox({
              src: current.image,
              title: current.title,
              caption: current.stat,
              year: 'Deep-Dive',
              tag: current.eyebrow,
            })
          }
          style={{ cursor: 'pointer' }}
        >
          <HistoryImage src={current.image} alt={current.title} />
          <div className="deepdive-media-badge">{current.stat}</div>
        </button>

        <div className="deepdive-content">
          <span className="section-eyebrow" style={{ marginBottom: 0 }}>
            {current.eyebrow}
          </span>
          <h3 id="history-essay-title">{current.title}</h3>
          {current.paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </article>
    </section>
  );
}
