'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';

interface TypingIndicatorProps {
  opponentName: string;
  isTyping: boolean;
}

function getMessages(name: string): string[] {
  return [
    `🍳 ${name} is cooking...`,
    `⚠️ Mental damage incoming...`,
    `💀 Something terrible approaches...`,
    `🔥 ${name} is about to end your career...`,
  ];
}

function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-[4px] h-[4px] rounded-full bg-yellow-400/80"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

export default function TypingIndicator({ opponentName, isTyping }: TypingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = getMessages(opponentName);

  useEffect(() => {
    if (!isTyping) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isTyping, messages.length]);

  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-white/[0.04] backdrop-blur-md',
            'border border-white/[0.08]'
          )}
          initial={{ y: 10, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -5, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIndex}
              className="text-xs text-white/60 font-medium"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.25 }}
            >
              {messages[messageIndex]}
            </motion.span>
          </AnimatePresence>
          <PulsingDots />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
