import { useState, useEffect, useRef } from 'react';

const SESSION_DURATION = 10 * 60; // 10 minutes in seconds

export function useBookingTimer(isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isActive && !startedRef.current) {
      startedRef.current = true;
      setTimeLeft(SESSION_DURATION);
      setIsExpired(false);
    }

    if (!isActive) {
      startedRef.current = false;
      setTimeLeft(SESSION_DURATION);
      setIsExpired(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { timeLeft, formattedTime, isExpired };
}
