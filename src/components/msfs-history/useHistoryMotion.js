import { useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useHistoryMotion(setup, query = '(prefers-reduced-motion: no-preference)') {
  useClientLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add(query, setup);
    return () => media.revert();
  }, []);
}
