import { useState, useEffect } from 'react';

export default function GlobalProgress() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId;
    let fadeOutTimeoutId;

    const handleStart = () => {
      if (fadeOutTimeoutId) clearTimeout(fadeOutTimeoutId);
      setProgress(0);
      setVisible(true);
      
      // Instantly start with 15%
      setProgress(15);

      // Creep up slowly to 90%
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(intervalId);
            return 90;
          }
          // The closer it gets to 90, the slower it increases
          const diff = 90 - prev;
          const increment = Math.max(0.5, diff * 0.1);
          return prev + increment;
        });
      }, 200);
    };

    const handleEnd = () => {
      if (intervalId) clearInterval(intervalId);
      
      // Complete to 100%
      setProgress(100);

      // Fade out after completion transition (300ms)
      fadeOutTimeoutId = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    };

    window.addEventListener('global-loading-start', handleStart);
    window.addEventListener('global-loading-end', handleEnd);

    return () => {
      window.removeEventListener('global-loading-start', handleStart);
      window.removeEventListener('global-loading-end', handleEnd);
      if (intervalId) clearInterval(intervalId);
      if (fadeOutTimeoutId) clearTimeout(fadeOutTimeoutId);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full h-[3px] z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: progress === 100 ? 0 : 1 }}
    >
      <div 
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
