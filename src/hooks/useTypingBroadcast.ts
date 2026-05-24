'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypingBroadcastProps {
  channel: any;
  myName: string;
}

export function useTypingBroadcast({ channel, myName }: UseTypingBroadcastProps) {
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);

  const lastBroadcastRef = useRef<number>(0);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  // Set up listeners for the Realtime channel to receive typing-state events from other players
  useEffect(() => {
    if (!channel) return;

    const sub = channel.on('broadcast', { event: 'typing-state' }, (payload: any) => {
      const { sender, isTyping } = payload.payload;

      if (sender !== myName) {
        setOpponentName(sender);
        setOpponentTyping(isTyping);

        // Auto-clear typing indicator after 3 seconds of no typing events
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

        if (isTyping) {
          clearTimerRef.current = setTimeout(() => {
            setOpponentTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      // Cleanup custom channel listener
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [channel, myName]);

  // Broadcast typing status with a 500ms debounce
  const broadcastTyping = useCallback(
    (isTyping = true) => {
      if (!channel) return;

      const now = Date.now();
      // Throttle typing broadcasts to every 500ms to avoid network spam,
      // but always allow sending typing=false (stop typing) immediately.
      if (!isTyping || now - lastBroadcastRef.current > 500) {
        channel.send({
          type: 'broadcast',
          event: 'typing-state',
          payload: { sender: myName, isTyping },
        });
        lastBroadcastRef.current = now;
      }
    },
    [channel, myName]
  );

  return {
    broadcastTyping,
    opponentTyping,
    opponentName,
  };
}
