import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiEffect() {
  useEffect(() => {
    const duration = 4000;
    const end = Date.now() + duration;

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#e50914', '#d4af37', '#ff6b35', '#fff', '#ffd700'],
    });

    // Continuous subtle confetti
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#e50914', '#d4af37', '#ffd700'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#e50914', '#d4af37', '#ffd700'],
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return null;
}
