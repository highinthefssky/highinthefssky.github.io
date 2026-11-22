import { createContext, useContext } from 'react';

export interface HistoryAsset {
  src: string;
  width: number;
  height: number;
  avif: string;
  webp: string;
  fullSrc: string;
}

export const HistoryAssets = createContext<Record<string, HistoryAsset>>({});

interface Props {
  src: string;
  alt: string;
  priority?: boolean;
}

export default function HistoryImage({ src, alt, priority = false }: Props) {
  const assets = useContext(HistoryAssets);
  const image = assets[src];
  if (!image) throw new Error(`Missing history image: ${src}`);

  return (
    <picture>
      <source type="image/avif" srcSet={image.avif} sizes="(max-width: 768px) 100vw, 1200px" />
      <source type="image/webp" srcSet={image.webp} sizes="(max-width: 768px) 100vw, 1200px" />
      <img src={image.src} alt={alt} width={image.width} height={image.height}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined}
        decoding="async" />
    </picture>
  );
}
