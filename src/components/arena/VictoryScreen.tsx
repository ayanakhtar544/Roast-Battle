'use client';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import type { Roast } from '@/stores/battleStore';

interface VictoryScreenProps {
  show: boolean;
  winner: string;
  loser: string;
  finalVerdict: string;
  winnerScore: number;
  loserScore: number;
  mostCookedRoast: Roast | null;
  onRematch?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
}

export function VictoryScreen({
  show,
  winner,
  loser,
  finalVerdict,
  winnerScore,
  loserScore,
  mostCookedRoast,
  onRematch,
  onDownload,
  onClose,
}: VictoryScreenProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

          {/* Particles/sparks */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 1,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#facc15', '#ff2d55', '#ff6b35', '#a855f7', '#22d3ee'][
                    Math.floor(Math.random() * 5)
                  ],
                  boxShadow: `0 0 10px currentColor`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative z-10 w-full max-w-md glass-heavy rounded-3xl p-6 md:p-8 border border-arena-yellow/20 shadow-arena-glow"
          >
            {/* Trophy */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 10, delay: 0.4 }}
              className="text-center mb-4"
            >
              <span className="text-6xl md:text-7xl">🏆</span>
            </motion.div>

            {/* Winner announcement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-6"
            >
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mb-2">
                WINNER
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-arena-yellow neon-text-yellow uppercase tracking-wider">
                {winner}
              </h2>
              <p className="text-xs text-white/30 mt-2">
                defeated <span className="text-arena-red line-through">{loser}</span>
              </p>
            </motion.div>

            {/* Score */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-6 mb-6"
            >
              <div className="text-center">
                <div className="text-3xl font-black text-arena-yellow">{winnerScore}</div>
                <div className="text-[9px] text-white/30 font-bold uppercase">{winner}</div>
              </div>
              <div className="text-2xl text-white/20 font-black">VS</div>
              <div className="text-center">
                <div className="text-3xl font-black text-white/30">{loserScore}</div>
                <div className="text-[9px] text-white/30 font-bold uppercase">{loser}</div>
              </div>
            </motion.div>

            {/* AI Verdict */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-black/40 rounded-xl p-4 border border-arena-purple/20 mb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⚖️</span>
                <span className="text-[9px] font-black text-arena-purple uppercase tracking-widest">
                  FINAL VERDICT
                </span>
              </div>
              <p className="text-sm text-white/70 font-medium leading-relaxed italic">
                "{finalVerdict}"
              </p>
            </motion.div>

            {/* Most Cooked Moment */}
            {mostCookedRoast && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="bg-arena-red/10 rounded-xl p-3 border border-arena-red/20 mb-6"
              >
                <p className="text-[9px] font-black text-arena-red uppercase tracking-widest mb-1">
                  🔥 MOST COOKED MOMENT
                </p>
                <p className="text-xs text-white/60 font-semibold">
                  <span className="text-white/30">{mostCookedRoast.sender}:</span> "{mostCookedRoast.text}"
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex flex-col gap-3"
            >
              {onDownload && (
                <button
                  onClick={onDownload}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider',
                    'bg-gradient-to-r from-arena-purple to-arena-cyan text-white',
                    'border-b-[4px] border-purple-900 active:border-b-0 active:translate-y-[4px]',
                    'hover:opacity-90 transition-all'
                  )}
                >
                  📹 DOWNLOAD BATTLE CLIP
                </button>
              )}

              <div className="flex gap-3">
                {onRematch && (
                  <button
                    onClick={onRematch}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider',
                      'bg-arena-yellow text-black',
                      'border-b-[4px] border-yellow-700 active:border-b-0 active:translate-y-[4px]',
                      'transition-all'
                    )}
                  >
                    🔄 REMATCH
                  </button>
                )}
                {onClose && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider',
                      'bg-zinc-800 text-white/60',
                      'border-b-[4px] border-zinc-950 active:border-b-0 active:translate-y-[4px]',
                      'transition-all'
                    )}
                  >
                    EXIT
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
