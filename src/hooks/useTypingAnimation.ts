import { useState, useEffect, useRef, useCallback } from 'react';

export function useTypingAnimation(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isStopped, setIsStopped] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // Function to instantly stop and show all text
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(text);
    setIsTyping(false);
    setIsStopped(true);
  }, [text]);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsTyping(true);
    setIsStopped(false);
    indexRef.current = 0;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!text) {
      setIsTyping(false);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        setIsTyping(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed]);

  return { displayedText, isTyping, stop, isStopped };
}
