'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';

interface AIJudgePanelProps {
  verdict: { winner: string; verdict: string; damageScore: string | number } | null;
  commentary: string | null;
  latestReaction: string | null;
  isJudging: boolean;
  className?: string;
}

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-arena-purple">▊</span>}
    </span>
  );
}

export function AIJudgePanel({
  verdict,
  commentary,
  latestReaction,
  isJudging,
  className,
}: AIJudgePanelProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Latest AI Reaction (per-roast) */}
      <AnimatePresence mode="wait">
        {latestReaction && (
          <motion.div
            key={latestReaction}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-start gap-2 px-3 py-2 bg-arena-purple/10 border border-arena-purple/20 rounded-xl"
          >
            <span className="text-lg shrink-0">🧠</span>
            <p className="text-xs text-arena-purple/80 font-semibold italic">
              "{latestReaction}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Commentary */}
      <AnimatePresence mode="wait">
        {commentary && (
          <motion.div
            key={commentary}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-2 px-3 py-2 bg-arena-fire/10 border border-arena-fire/20 rounded-xl"
          >
            <span className="text-lg shrink-0">🎙️</span>
            <p className="text-xs text-arena-fire font-bold uppercase tracking-wide">
              {commentary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judging state */}
      <AnimatePresence>
        {isJudging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-arena-purple/20 to-arena-red/20 border border-arena-purple/30 rounded-xl"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-arena-purple animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-arena-purple animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-arena-purple animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-black text-arena-purple uppercase tracking-wider">
              AI IS ANALYZING...
            </span>
            <span className="text-lg animate-spin-slow">🧠</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verdict */}
      <AnimatePresence>
        {verdict && !isJudging && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative overflow-hidden rounded-2xl border border-arena-purple/30"
          >
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-arena-purple/10 via-arena-dark to-arena-red/10" />

            <div className="relative p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                <span className="text-xs font-black text-arena-purple uppercase tracking-widest">
                  AI VERDICT
                </span>
              </div>

              {/* Winner */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 font-bold uppercase">Winner:</span>
                <span className="text-sm font-black text-arena-yellow neon-text-yellow uppercase">
                  {verdict.winner}
                </span>
              </div>

              {/* Verdict text */}
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <p className="text-sm text-white/80 font-semibold leading-relaxed">
                  <TypewriterText text={verdict.verdict} />
                </p>
              </div>

              {/* Damage score */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 font-bold uppercase">Damage Score</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-arena-red neon-text-red">
                    {verdict.damageScore}
                  </span>
                  <span className="text-[10px] text-white/30 font-bold">/ 100</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
