import { useRef } from 'react';
import gsap from 'gsap';
import { Compass } from 'lucide-react';
import { FRANCHISE_META } from '../../data/msfsHistory';
import HistoryImage from './HistoryImage';
import { useHistoryMotion } from './useHistoryMotion';

export default function HeroPortal() {
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const ringRef = useRef(null);
  const backdropRef = useRef(null);

  useHistoryMotion(() => {
    const context = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: () => `top top+=${document.querySelector('.navbar').getBoundingClientRect().height}`,
          end: '+=90%',
          scrub: 0.8,
          pin: stageRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
        .to(ringRef.current, { scale: 5, opacity: 0, ease: 'power2.in' }, 0)
        .fromTo(backdropRef.current, { scale: 1.12 }, { scale: 1, ease: 'none' }, 0);
    }, wrapperRef);
    return () => context.revert();
  }, '(min-width: 961px) and (prefers-reduced-motion: no-preference)');

  return (
    <section id="hero" ref={wrapperRef} className="hero-portal-wrapper" aria-label="Introduction" tabIndex={-1}>
      <div ref={stageRef} className="hero-portal-stage">
        <div ref={backdropRef} className="hero-backdrop">
          <HistoryImage src="./screenshots/hero-sky.jpg" alt="Airliner above golden-hour clouds, an illustration of modern flight simulation" priority />
        </div>
        <div className="hero-backdrop-vignette" />
        <div ref={ringRef} className="history-portal-frame" aria-hidden="true" />
        <div className="hero-revealed-content">
          <div className="hero-eyebrow"><Compass size={14} /><span>High in the FlightSim Sky · Historical Archive</span></div>
          <h1 className="hero-portal-title">Microsoft<span>Flight Simulator</span></h1>
          <p className="hero-portal-years">1975 — 2026</p>
          <p className="hero-revealed-lead">{FRANCHISE_META.tagline}</p>
          <div className="hero-stats-grid">
            {FRANCHISE_META.heroStats.map(stat => (
              <div key={stat.label} className="hero-stat-pill">
                <div className="hero-stat-val">{stat.value}<span className="hero-stat-unit">{stat.unit}</span></div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
          <a className="history-start-link" href="#overview">Explore the archive ↓</a>
        </div>
      </div>
    </section>
  );
}
