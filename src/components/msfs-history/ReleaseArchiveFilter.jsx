import React, { useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ERAS } from '../../data/msfsHistory';

export default function ReleaseArchiveFilter({
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  onJumpToRelease,
}) {
  const allReleases = useMemo(
    () =>
      ERAS.flatMap((era) =>
        era.releases.map((rel) => ({
          ...rel,
          eraId: era.id,
          eraNumber: era.number,
          eraTitle: era.title,
        }))
      ),
    []
  );

  const popularTags = [
    '#DOS',
    '#Windows',
    '#MeigsField',
    '#Direct3D',
    '#ATC',
    '#64Bit',
    '#SpinOff',
    '#CloudStreaming',
    '#VR',
    '#PS5',
    '#CareerMode',
  ];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allReleases.filter((rel) => {
      const matchesTag = !selectedTag || rel.tags.includes(selectedTag);
      const matchesQuery =
        !q ||
        rel.title.toLowerCase().includes(q) ||
        rel.developer.toLowerCase().includes(q) ||
        rel.platforms.toLowerCase().includes(q) ||
        rel.innovation.toLowerCase().includes(q) ||
        rel.features.toLowerCase().includes(q) ||
        rel.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTag && matchesQuery;
    });
  }, [allReleases, searchQuery, selectedTag]);

  const hasFilter = Boolean(searchQuery.trim() || selectedTag);

  return (
    <section id="archive-search" tabIndex={-1} className="section-container" style={{ paddingTop: '2.5rem' }}>
      <div className="section-header" style={{ marginBottom: '1.8rem' }}>
        <div className="section-eyebrow">
          <Filter size={14} />
          <span>Interactive Flight Log Index · {allReleases.length} releases &amp; spin-offs</span>
        </div>
        <h2 className="section-title">Filter &amp; Search Every Release (1979–2026)</h2>
        <p className="section-subtitle">
          Search by aircraft (Concorde, Wright Flyer, Cessna 185F), technology (CGA, Direct3D,
          SimConnect, DLSS 4.5), platform (Apple II, PlayStation 5), or category tag.
        </p>
      </div>

      <div className="archive-controls">
        <div className="archive-search-row">
          <div className="archive-search-wrap">
            <Search size={17} className="archive-search-icon" />
            <input
              type="search"
              className="archive-search-input"
              placeholder="Search releases, aircraft, tech, or developers (e.g. Meigs, Concorde, Asobo, PS5)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search Microsoft Flight Simulator releases"
            />
          </div>

          <span className="archive-count" role="status">
            Showing {filtered.length} of {allReleases.length} releases
          </span>

          {hasFilter && (
            <button
              type="button"
              className="filter-pill"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>

        <div className="archive-tag-cloud">
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`release-tag-btn ${selectedTag === tag ? 'active' : ''}`}
              aria-pressed={selectedTag === tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {hasFilter && (
        <div className="era-releases-grid">
          {filtered.length === 0 ? (
            <div className="release-card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <p>No releases matched your filter. Try clearing the search or choosing another tag.</p>
            </div>
          ) : (
            filtered.map((rel) => (
              <article key={rel.id} className="release-card">
                <div className="release-card-head">
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.7rem',
                        color: 'var(--accent)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {rel.eraNumber} · {rel.eraTitle}
                    </div>
                    <h3 className="release-title">{rel.title}</h3>
                  </div>
                  <span className="release-year-chip">{rel.year}</span>
                </div>

                <div className="release-innovation">
                  <strong>Headline Innovation</strong>
                  {rel.innovation}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginTop: 'auto',
                  }}
                >
                  <div className="release-tags" style={{ paddingTop: 0 }}>
                    {rel.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`release-tag-btn ${selectedTag === tag ? 'active' : ''}`}
                        aria-pressed={selectedTag === tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="filter-pill"
                    onClick={() => onJumpToRelease(`release-${rel.id}`)}
                  >
                    Jump to Full Profile →
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
