import React, { useState, useMemo } from 'react';
import { Radio } from 'lucide-react';
import { MSFS2024_UPDATES } from '../../data/msfsHistory';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'platform', label: 'Platform milestones' },
  { id: 'sim', label: 'Sim updates' },
  { id: 'world', label: 'World & city updates' },
];

export default function RecoveryTimeline2024() {
  const [activeFilter, setActiveFilter] = useState('all');

  const items = useMemo(() => {
    if (activeFilter === 'all') return MSFS2024_UPDATES;
    return MSFS2024_UPDATES.filter((item) => item.categories.includes(activeFilter));
  }, [activeFilter]);

  return (
    <section id="recovery-2024" tabIndex={-1} className="section-container">
      <div className="section-header">
        <div className="section-eyebrow">
          <Radio size={14} />
          <span>MSFS 2024 Live Operations Log (Nov 2024 – Late 2026 &amp; 2027 Roadmap)</span>
        </div>
        <h2 className="section-title">Two Years of Recovery &amp; Expansion</h2>
        <p className="section-subtitle">
          Following its November 2024 server-constrained launch, Asobo Studio shipped seven major
          Sim Updates, five World Updates, and four City Updates through November 2026—anchoring
          Sim Update 4 to the PlayStation 5 launch and Sim Update 5 to PlayStation VR2 support.
        </p>
      </div>

      <div className="filter-bar" role="group" aria-label="Filter MSFS 2024 updates">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={activeFilter === f.id}
            className={`filter-pill ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label} ({f.id === 'all' ? MSFS2024_UPDATES.length : MSFS2024_UPDATES.filter(item => item.categories.includes(f.id)).length})
          </button>
        ))}
      </div>

      <p className="history-filter-status" role="status">Showing {items.length} timeline milestones</p>
      <div className="recovery-timeline">
        {items.map((item) => (
          <article
            key={`${item.date}-${item.title}`}
            className={`recovery-item ${item.yearGroup === '2027 ROADMAP' ? 'is-roadmap' : ''}`}
          >
            <span className="recovery-dot" aria-hidden="true" />
            <div className="recovery-item-top">
              <span className="recovery-date">{item.date}</span>
              <h3 className="recovery-title">{item.title}</h3>
              {item.badges.map((badge) => {
                let cls = 'recovery-badge';
                if (badge === 'Server Outage') cls += ' badge-outage';
                else if (badge === 'Platform') cls += ' badge-platform';
                else if (badge === 'World / City') cls += ' badge-world';
                return (
                  <span key={badge} className={cls}>
                    {badge}
                  </span>
                );
              })}
            </div>
            <p className="recovery-summary">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
