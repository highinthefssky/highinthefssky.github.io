import { useHistoryMotion } from './useHistoryMotion';
import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Maximize2, Camera } from 'lucide-react';
import HistoryImage from './HistoryImage';

gsap.registerPlugin(ScrollTrigger);

export default function EraShowcase({ era, onOpenLightbox, onSelectTag }) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);

  useHistoryMotion(() => {
    const ctx = gsap.context(() => {
      // GTA VI-style full-bleed scrubbed parallax backdrop
      gsap.fromTo(
        bgRef.current,
        { yPercent: -10, scale: 1.12 },
        {
          yPercent: 10,
          scale: 1.04,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current.querySelector('.era-banner'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );

      // Banner headline entrance
      gsap.from(sectionRef.current.querySelectorAll('.era-banner-reveal'), {
        y: 34,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current.querySelector('.era-banner'),
          start: 'top 72%',
          once: true,
        },
      });

      // Staggered postcard gallery parallax drift
      const shots = sectionRef.current.querySelectorAll('.era-shot-card');
      shots.forEach((shot, i) => {
        gsap.fromTo(
          shot,
          { y: i % 2 === 1 ? 42 : 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: shot,
              start: 'top 86%',
              once: true,
            },
          }
        );
      });

      // Release profile cards entrance
      gsap.from(sectionRef.current.querySelectorAll('.release-card'), {
        y: 32,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current.querySelector('.era-releases-grid'),
          start: 'top 84%',
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  });

  return (
    <section
      id={era.id}
      tabIndex={-1}
      ref={sectionRef}
      className="era-chapter"
      data-era-accent={era.atmosphere.accent}
      data-era-glow={era.atmosphere.glow}
      data-era-secondary={era.atmosphere.secondary}
      style={{ '--era-card-accent': era.atmosphere.accent }}
    >
      {/* Full-bleed GTA VI-style Era Interstitial Banner */}
      <div className="era-banner">
        <div ref={bgRef} className="era-banner-bg">
          <HistoryImage src={era.heroScreenshot} alt={era.heroCaption} />
        </div>
        <div className="era-banner-scrim" />

        <div className="era-banner-inner">
          <div className="era-banner-meta era-banner-reveal">
            <span className="era-pill">{era.number}</span>
            <span className="era-pill">{era.atmosphere.badge}</span>
            <span className="era-years-badge">{era.years} · {era.atmosphere.altitude}</span>
          </div>

          <h2 className="era-banner-title era-banner-reveal">{era.title}</h2>
          <p className="era-banner-sub era-banner-reveal">{era.subtitle}</p>
          <p className="era-banner-intro era-banner-reveal">{era.intro}</p>

          <button
            type="button"
            className="era-banner-caption-btn era-banner-reveal"
            onClick={() =>
              onOpenLightbox({
                src: era.heroScreenshot,
                title: `${era.number}: ${era.title}`,
                caption: era.heroCaption,
                year: era.years,
                tag: era.atmosphere.badge,
              })
            }
          >
            <Camera size={15} />
            <span>Inspect Era Key Visual</span>
          </button>
        </div>
      </div>

      {/* Staggered Asymmetric Screenshot Postcards + Release Cards */}
      <div className="era-body">
        <div className="era-gallery-header">
          <span className="era-gallery-label">
            {era.number} · Era visuals ({era.gallery.length} images)
          </span>
          <span className="era-gallery-hint">Select an image to open the full-screen viewer</span>
        </div>

        <div className={`era-gallery-grid count-${era.gallery.length}`}>
          {era.gallery.map((shot) => (
            <button
              key={shot.title}
              type="button"
              className="era-shot-card"
              onClick={() => onOpenLightbox(shot)}
            >
              <div className="era-shot-media">
                <HistoryImage src={shot.src} alt={shot.title} />
                <span className="era-shot-badge">{shot.year} · {shot.tag}</span>
                <span className="era-shot-zoom" aria-hidden="true">
                  <Maximize2 size={14} />
                </span>
              </div>
              <div className="era-shot-info">
                <h3>{shot.title}</h3>
                <p>{shot.caption}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Verified Release Profiles */}
        <div className="era-gallery-header">
          <span className="era-gallery-label">
            Release archive ({era.releases.length} {era.releases.length === 1 ? 'Entry' : 'Entries'})
          </span>
          <span className="era-gallery-hint">Click any #tag to filter across all eras</span>
        </div>

        <div className={`era-releases-grid ${era.releases.length === 1 ? 'single-col' : ''}`}>
          {era.releases.map((rel) => (
            <article key={rel.id} id={`release-${rel.id}`} className="release-card" tabIndex={-1}>
              <div className="release-card-head">
                <h3 className="release-title">{rel.title}</h3>
                <span className="release-year-chip">{rel.year}</span>
              </div>

              <div className="release-meta-rows">
                <div className="release-meta-item">
                  <span>Exact Release Date</span>
                  <strong>{rel.releaseDate}</strong>
                </div>
                <div className="release-meta-item">
                  <span>Developer &amp; Publisher</span>
                  <strong>{rel.developer}</strong>
                </div>
                <div className="release-meta-item" style={{ gridColumn: '1 / -1' }}>
                  <span>Target Platforms</span>
                  <strong>{rel.platforms}</strong>
                </div>
              </div>

              <div className="release-innovation">
                <strong>Headline Innovation</strong>
                {rel.innovation}
              </div>

              <div className="release-details-block">
                <p>
                  <b>Key Features &amp; Content: </b>
                  {rel.features}
                </p>
                <p>
                  <b>Cultural &amp; Technical Impact: </b>
                  {rel.impact}
                </p>
              </div>

              <div className="release-tags">
                {rel.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="release-tag-btn"
                    onClick={() => onSelectTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
