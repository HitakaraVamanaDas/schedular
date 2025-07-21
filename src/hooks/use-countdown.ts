'use client';
import { useEffect, useState } from 'react';
import { intervalToDuration, isPast } from 'date-fns';

export const useCountdown = (targetDate: Date) => {
  const calculateCountdown = () => {
    if (isPast(targetDate)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const duration = intervalToDuration({ start: new Date(), end: targetDate });
    return {
      days: duration.days ?? 0,
      hours: duration.hours ?? 0,
      minutes: duration.minutes ?? 0,
      seconds: duration.seconds ?? 0,
    };
  };
  
  const [countdown, setCountdown] = useState(calculateCountdown());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
};
