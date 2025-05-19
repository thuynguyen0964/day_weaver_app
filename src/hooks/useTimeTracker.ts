"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimeTrackerState {
  isRunning: boolean;
  elapsedSeconds: number;
}

export const useTimeTracker = (initialElapsedSeconds: number = 0) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, [isRunning]);

  const stop = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    if (startTimeRef.current) {
      // Update elapsedSeconds with the final duration from this run
      // This is handled by the effect cleanup, but can be done explicitly here if needed
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null; // Reset start time
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    if (isRunning) {
      // If resuming, startTimeRef.current should already be set by start()
      // If it's a fresh start, it's also set by start()
      // The key is that elapsedSeconds accumulates.
      
      // If there's no startTimeRef (e.g. after stop and then start), set it.
      if(!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const delta = Math.floor((now - startTimeRef.current) / 1000);
          setElapsedSeconds(prev => prev + delta);
          startTimeRef.current = now; // Update startTime for the next 1-second interval
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
       // When stopping, startTimeRef.current is cleared by the stop function
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);
  
  // Persist initialElapsedSeconds if it changes from props
  useEffect(() => {
    setElapsedSeconds(initialElapsedSeconds);
  }, [initialElapsedSeconds]);


  return { isRunning, elapsedSeconds, start, stop, reset };
};
