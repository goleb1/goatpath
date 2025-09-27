import React, { useState, useEffect } from 'react';
import { Stop } from '../../types/Event';

interface TimerProps {
  stop: Stop;
  isActive: boolean;
}

export function Timer({ stop, isActive }: TimerProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!isActive || !stop.arrivalTime) {
      setElapsedMinutes(0);
      return;
    }

    const startTime = new Date(stop.arrivalTime);
    
    const updateTimer = () => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      setElapsedMinutes(Math.max(0, diffMinutes));
    };

    // Update immediately
    updateTimer();
    
    // Then update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, stop.arrivalTime]);

  if (!isActive || !stop.arrivalTime) {
    return null;
  }

  const getTimerColor = () => {
    if (elapsedMinutes >= 20) return 'retro-red';
    if (elapsedMinutes >= 10) return 'retro-amber';
    return 'retro-green';
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`text-lg font-bold ${getTimerColor()}`}>
      ⏱ {formatTime(elapsedMinutes)}
    </div>
  );
}