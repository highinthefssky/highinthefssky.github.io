import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { TRIVIA_CARDS } from '../../data/msfsHistory';

const ERA_FILTERS = ['All', 'Era 1', 'Era 2', 'Era 3', 'Era 4', 'Era 5'];

export default function TriviaDeck() {
  const [selectedEra, setSelectedEra] = useState('All');

  const cards = useMemo(() => {
    if (selectedEra === 'All') return TRIVIA_CARDS;
    return TRIVIA_CARDS.filter((c) => c.era === selectedEra);
  }, [selectedEra]);

  return (
    <section id="trivia" tabIndex={-1} className="section-container">
      <div className="section-header">
        <div className="section-eyebrow">
          <Sparkles size={14} />
          <span>05 · Flight Deck Logbook &amp; Micro-History</span>
        </div>
        <h2 className="section-title">{TRIVIA_CARDS.length} Stories From 51 Years of Flight Sim</h2>
        <p className="section-subtitle">
          From 16 cassette recorders wired in parallel and overnight bulldozers at Meigs Field to a
          212-story Melbourne typo and breaking Sony’s airspace in December 2025.
        </p>
      </div>

      <div className="filter-bar" role="group" aria-label="Filter trivia cards by era">
        {ERA_FILTERS.map((era) => (
          <button
            key={era}
            type="button"
            aria-pressed={selectedEra === era}
            className={`filter-pill ${selectedEra === era ? 'active' : ''}`}
            onClick={() => setSelectedEra(era)}
          >
            {era === 'All' ? `All (${TRIVIA_CARDS.length})` : era}
          </button>
        ))}
      </div>

      <p className="history-filter-status" role="status">Showing {cards.length} stories</p>
      <div className="trivia-grid">
        {cards.map((card) => (
          <article key={card.id} className="trivia-card">
            <div className="trivia-card-top">
              <span className="trivia-index">LOG #{String(card.id).padStart(2, '0')}</span>
              <span className="trivia-era-pill">
                {card.era} · {card.year}
              </span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.fact}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
