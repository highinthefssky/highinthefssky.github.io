import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ERAS, DEEP_DIVES } from '../../data/msfsHistory';
import { HistoryAssets, type HistoryAsset } from './HistoryImage';
import HeroPortal from './HeroPortal';
import FlightDeckHUD from './FlightDeckHUD';
import FiveThemesStrip from './FiveThemesStrip';
import CodebaseLineageMap from './CodebaseLineageMap';
import ReleaseArchiveFilter from './ReleaseArchiveFilter';
import EraShowcase from './EraShowcase';
import RecoveryTimeline2024 from './RecoveryTimeline2024';
import HardwareChartsAndTable from './HardwareChartsAndTable';
import DeepDivesSection from './DeepDivesSection';
import TriviaDeck from './TriviaDeck';
import ScreenshotLightbox, { type HistoryShot } from './ScreenshotLightbox';

const screenshots: HistoryShot[] = [
  ...ERAS.flatMap(era => era.gallery),
  ...DEEP_DIVES.map(dive => ({
    src: dive.image, title: dive.title, caption: dive.stat, year: 'Deep dive', tag: dive.eyebrow,
  })),
].filter((shot, index, items) => items.findIndex(item => item.src === shot.src) === index);

export default function HistoryExperience({ assets }: { assets: Record<string, HistoryAsset> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [shot, setShot] = useState<HistoryShot | null>(null);
  const closeLightbox = useCallback(() => setShot(null), []);
  const openLightbox = useCallback((image: HistoryShot) => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setShot(image);
  }, []);

  const scrollToElement = useCallback((id: string, updateHash = true) => {
    const target = document.getElementById(id);
    if (!target) throw new Error(`Missing history section: ${id}`);
    const offset = document.querySelector('.navbar')?.getBoundingClientRect().height ?? 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
    if (updateHash) history.pushState(null, '', `#${id}`);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(top, { immediate: !updateHash });
    } else {
      window.scrollTo({ top, behavior: reduced || !updateHash ? 'instant' : 'smooth' });
    }
    target.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const navbar = document.querySelector('.navbar');
    const updateOffset = () => {
      const height = navbar?.getBoundingClientRect().height ?? 0;
      root.style.setProperty('--history-nav-height', `${height}px`);
      ScrollTrigger.refresh();
    };
    const resize = new ResizeObserver(updateOffset);
    if (navbar) resize.observe(navbar);
    updateOffset();

    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: false });
      lenisRef.current = lenis;
      if (root.querySelector('dialog[open]')) lenis.stop();
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        lenisRef.current = null;
      };
    });

    const context = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('section[id]').forEach(section => {
        const activate = () => {
          setActiveSection(section.id);
          root.style.setProperty('--era-accent', section.dataset.eraAccent || '#7dd3fc');
          root.style.setProperty('--era-glow', section.dataset.eraGlow || 'rgba(14, 165, 233, 0.16)');
          root.style.setProperty('--era-secondary', section.dataset.eraSecondary || 'rgba(56, 189, 248, 0.12)');
        };
        ScrollTrigger.create({
          trigger: section, start: 'top 52%', end: 'bottom 48%', onEnter: activate, onEnterBack: activate,
        });
      });
      gsap.to('.scroll-progress-bar', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true },
      });
    }, root);

    const jumpToHash = () => {
      const id = window.location.hash.slice(1);
      if (id && Array.from(root.querySelectorAll('[id]')).some(element => element.id === id)) {
        scrollToElement(id, false);
      }
    };
    // Pin measurements can settle after hydration. Preserve the initial anchor until user navigation.
    let preserveInitialAnchor = Boolean(window.location.hash);
    const restoreInitialAnchor = () => {
      if (preserveInitialAnchor) jumpToHash();
    };
    const releaseInitialAnchor = () => { preserveInitialAnchor = false; };
    const navigateHash = () => { jumpToHash(); };
    ScrollTrigger.addEventListener('refresh', restoreInitialAnchor);
    window.addEventListener('wheel', releaseInitialAnchor, { passive: true });
    window.addEventListener('pointerdown', releaseInitialAnchor);
    window.addEventListener('keydown', releaseInitialAnchor);
    // Refresh after layout and fonts settle before resolving deep links into pinned sections.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      restoreInitialAnchor();
    });
    window.addEventListener('hashchange', navigateHash);
    window.addEventListener('popstate', navigateHash);
    const backToTop = document.getElementById('back-to-top');
    const jumpToTop = (event: Event) => {
      event.stopImmediatePropagation();
      if (lenisRef.current) lenisRef.current.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: 'instant' });
    };
    backToTop?.addEventListener('click', jumpToTop, true);
    root.dataset.ready = 'true';
    return () => {
      cancelled = true;
      resize.disconnect();
      ScrollTrigger.removeEventListener('refresh', restoreInitialAnchor);
      window.removeEventListener('wheel', releaseInitialAnchor);
      window.removeEventListener('pointerdown', releaseInitialAnchor);
      window.removeEventListener('keydown', releaseInitialAnchor);
      window.removeEventListener('hashchange', navigateHash);
      window.removeEventListener('popstate', navigateHash);
      backToTop?.removeEventListener('click', jumpToTop, true);
      context.revert();
      media.revert();
    };
  }, [scrollToElement]);

  useEffect(() => {
    if (shot) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [shot]);

  return (
    <HistoryAssets.Provider value={assets}>
      <div className="msfs-history" ref={rootRef}>
        <div className="ambient-atmosphere" aria-hidden="true" />
        <div className="scroll-progress-bar" aria-hidden="true" />
        <div className="app-shell">
          <HeroPortal />
          <FlightDeckHUD activeSection={activeSection} onJump={scrollToElement} />
          <FiveThemesStrip />
          <CodebaseLineageMap onJump={scrollToElement} />
          <ReleaseArchiveFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            selectedTag={selectedTag} setSelectedTag={setSelectedTag} onJumpToRelease={scrollToElement} />
          {ERAS.map(era => (
            <EraShowcase key={era.id} era={era} onOpenLightbox={openLightbox}
              onSelectTag={(tag: string) => { setSelectedTag(tag); scrollToElement('archive-search'); }} />
          ))}
          <RecoveryTimeline2024 />
          <HardwareChartsAndTable />
          <DeepDivesSection onOpenLightbox={openLightbox} />
          <TriviaDeck />
        </div>
        {shot && <ScreenshotLightbox shot={shot} items={screenshots} onClose={closeLightbox}
          onNavigate={setShot} returnFocus={openerRef.current} />}
      </div>
    </HistoryAssets.Provider>
  );
}
