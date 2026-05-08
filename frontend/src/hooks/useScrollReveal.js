import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook untuk scroll-triggered reveal animation.
 * Hanya digunakan di LandingPage.
 * @param {Object} options - threshold, rootMargin
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Memoize options to prevent re-creating observer on every render
  const threshold = options.threshold ?? 0.15;
  const rootMargin = options.rootMargin ?? '0px 0px -60px 0px';

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element); // Hanya animate sekali
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
