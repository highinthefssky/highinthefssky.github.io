import { useContext, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { HistoryAssets } from './HistoryImage';

export interface HistoryShot {
  src: string;
  title: string;
  caption: string;
  year: string;
  tag: string;
}

interface Props {
  shot: HistoryShot;
  items: HistoryShot[];
  onClose: () => void;
  onNavigate: (shot: HistoryShot) => void;
  returnFocus: HTMLElement | null;
}

export default function ScreenshotLightbox({ shot, items, onClose, onNavigate, returnFocus }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const assets = useContext(HistoryAssets);
  const image = assets[shot.src];
  if (!image) throw new Error(`Missing full-size history image: ${shot.src}`);
  const index = items.findIndex(item => item.src === shot.src);
  if (index < 0) throw new Error(`Missing gallery entry: ${shot.src}`);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      returnFocus?.focus({ preventScroll: true });
    };
  }, []);

  const navigate = (direction: number) => onNavigate(items[(index + direction + items.length) % items.length]);
  return (
    <dialog ref={dialogRef} className="lightbox-backdrop" aria-labelledby="history-lightbox-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={event => {
        if (event.key === 'Tab') {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          navigate(event.key === 'ArrowRight' ? 1 : -1);
        }
      }}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close image viewer" autoFocus>
        <X size={20} />
      </button>
      <div className="lightbox-stage">
        <button type="button" className="lightbox-nav" onClick={() => navigate(-1)} aria-label="Previous image">
          <ChevronLeft size={24} />
        </button>
        <figure className="lightbox-figure">
          <img src={image.fullSrc} alt={shot.title} width={image.width} height={image.height} />
          <figcaption className="lightbox-caption">
            <div className="lightbox-caption-meta">{shot.year} · {index + 1} / {items.length}</div>
            <h3 id="history-lightbox-title">{shot.title}</h3>
            <p>{shot.caption}</p>
          </figcaption>
        </figure>
        <button type="button" className="lightbox-nav" onClick={() => navigate(1)} aria-label="Next image">
          <ChevronRight size={24} />
        </button>
      </div>
    </dialog>
  );
}
