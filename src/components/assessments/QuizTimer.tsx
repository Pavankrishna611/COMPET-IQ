'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface QuizTimerProps {
  initialSeconds?: number;
  onTimeUp?: () => void;
}

export function QuizTimer({
  initialSeconds = 1122, // 18 minutes 42 seconds
  onTimeUp,
}: QuizTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeUp]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = secondsRemaining < 300; // less than 5 minutes

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${formattedTime}`}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold transition-all shadow-sm ${
        isLowTime
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
          : 'bg-surface text-text-primary border-border'
      }`}
    >
      {isLowTime ? (
        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
      ) : (
        <Clock className="w-4 h-4 text-primary" />
      )}
      <span>{formattedTime}</span>
      <span className="text-[10px] font-sans text-text-muted font-normal uppercase tracking-wider hidden sm:inline">
        Remaining
      </span>
    </div>
  );
}
