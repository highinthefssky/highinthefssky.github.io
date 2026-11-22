import { useHistoryMotion } from './useHistoryMotion';
import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen } from 'lucide-react';
import { FRANCHISE_META, FIVE_THEMES } from '../../data/msfsHistory';

gsap.registerPlugin(ScrollTrigger);

export default function FiveThemesStrip() {
  const containerRef = useRef(null);

  useHistoryMotion(() => {
    const ctx = gsap.context(() => {
      gsap.from('.theme-card', {
        y: 36,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.themes-grid',
          start: 'top 84%',
          once: true,
        },
      });
    }, containerRef);
    return () => ctx.revert();
  });

  return (
    <section id="overview" tabIndex={-1} ref={containerRef} className="section-container">
      <div className="section-header">
        <div className="section-eyebrow">
          <BookOpen size={14} />
          <span>01 · Franchise Overview &amp; Core Narrative</span>
        </div>
        <h2 className="section-title">From 2 FPS Wireframes to a Digital Twin of Earth</h2>
      </div>

      <div className="executive-grid">
        <div className="executive-prose">
          {FRANCHISE_META.executiveBody.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        <div className="executive-callout">
          <div className="executive-callout-label">Franchise milestones</div>
          <div className="executive-callout-quote">
            “Older than Windows 1.0 (1985) and Microsoft Office (1990), Flight Simulator served
            alongside Lotus 1-2-3 as the PC industry’s ultimate 100% IBM compatibility test.”
          </div>
          <div className="executive-callout-meta">
            <div className="callout-mini">
              <strong>May 1975</strong>
              Bruce Artwick’s UIUC Master’s thesis
            </div>
            <div className="callout-mini">
              <strong>Nov 1, 1982</strong>
              MSFS 1.0 (v1.01) IBM PC debut
            </div>
            <div className="callout-mini">
              <strong>Dec 8, 2025</strong>
              Historic PlayStation 5 debut
            </div>
            <div className="callout-mini">
              <strong>Apr 30, 2026</strong>
              Free PS VR2 expansion via SU5
            </div>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginBottom: '1.8rem' }}>
        <div className="section-eyebrow">
          <span>Five Defining Themes of Franchise Evolution</span>
        </div>
      </div>

      <div className="themes-grid">
        {FIVE_THEMES.map((theme) => (
          <article key={theme.id} className="theme-card">
            <div className="theme-card-top">
              <span className="theme-num">{theme.number}</span>
              <span className="theme-metric">{theme.metric}</span>
            </div>
            <h3>{theme.title}</h3>
            <p>{theme.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
