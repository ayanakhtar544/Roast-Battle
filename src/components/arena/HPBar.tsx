'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';

interface HPBarProps {
  hp: number;
  playerName: string;
  side: 'left' | 'right';
  color?: string;
}

function getHPColor(hp: number): string {
  if (hp > 60) return '#39ff14';
  if (hp > 30) return '#facc15';
  return '#ff2d55';
}

function getHPGradient(hp: number, side: 'left' | 'right'): string {
  if (hp > 60) {
    return side === 'left'
      ? 'linear-gradient(90deg, #39ff14, #22d3ee)'
      : 'linear-gradient(270deg, #39ff14, #22d3ee)';
  }
  if (hp > 30) {
    return side === 'left'
      ? 'linear-gradient(90deg, #facc15, #ff6b35)'
      : 'linear-gradient(270deg, #facc15, #ff6b35)';
  }
  return side === 'left'
    ? 'linear-gradient(90deg, #ff2d55, #ff6b35)'
    : 'linear-gradient(270deg, #ff2d55, #ff6b35)';
}

export default function HPBar({ hp, playerName, side, color }: HPBarProps) {
  const prevHP = useRef(hp);
  const [tookDamage, setTookDamage] = useState(false);

  useEffect(() => {
    if (hp < prevHP.current) {
      setTookDamage(true);
      const timer = setTimeout(() => setTookDamage(false), 500);
      return () => clearTimeout(timer);
    }
    prevHP.current = hp;
  }, [hp]);

  // Update ref after damage animation triggers
  useEffect(() => {
    prevHP.current = hp;
  }, [hp]);

  const clampedHP = Math.max(0, Math.min(100, hp));
  const hpColor = color ?? getHPColor(clampedHP);
  const hpGradient = color
    ? `linear-gradient(90deg, ${color}, ${color}88)`
    : getHPGradient(clampedHP, side);
  const isCritical = clampedHP > 0 && clampedHP < 20;
  const isKO = clampedHP === 0;

  return (
    <div className={cn('flex flex-col gap-1 w-full', side === 'right' && 'items-end')}>
      {/* Player name + HP value */}
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-bold uppercase tracking-wider',
          side === 'right' && 'flex-row-reverse'
        )}
      >
        <span className="text-white/90 truncate max-w-[120px]">{playerName}</span>
        <span
          className="font-mono text-[10px] tabular-nums"
          style={{ color: hpColor }}
        >
          {clampedHP}%
        </span>
      </div>

      {/* HP Bar container */}
      <motion.div
        className={cn(
          'relative w-full h-[10px] rounded-full overflow-hidden',
          'bg-white/5 border border-white/10',
          isCritical && 'border-red-500/60'
        )}
        animate={
          tookDamage
            ? {
                x: [0, -4, 4, -3, 3, -1, 1, 0],
                transition: { duration: 0.4, ease: 'easeOut' },
              }
            : {}
        }
        style={
          isCritical
            ? {
                boxShadow: '0 0 8px rgba(255, 45, 85, 0.5), inset 0 0 4px rgba(255, 45, 85, 0.2)',
                animation: 'hpPulse 1s ease-in-out infinite',
              }
            : undefined
        }
      >
        {/* HP fill bar */}
        <motion.div
          className={cn(
            'absolute top-0 h-full rounded-full',
            side === 'left' ? 'left-0' : 'right-0'
          )}
          initial={false}
          animate={{
            width: `${clampedHP}%`,
          }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            background: hpGradient,
            boxShadow: `0 0 6px ${hpColor}66`,
          }}
        />

        {/* Damage flash overlay — briefly shows white when taking damage */}
        <AnimatePresence>
          {tookDamage && (
            <motion.div
              className="absolute inset-0 bg-white rounded-full"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {/* KO Overlay */}
        <AnimatePresence>
          {isKO && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-full"
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <span className="text-[8px] font-black tracking-widest text-red-500 uppercase">
                KO
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Critical HP pulse keyframes injected via style tag */}
      {isCritical && (
        <style jsx global>{`
          @keyframes hpPulse {
            0%, 100% {
              box-shadow: 0 0 8px rgba(255, 45, 85, 0.4),
                inset 0 0 4px rgba(255, 45, 85, 0.15);
            }
            50% {
              box-shadow: 0 0 16px rgba(255, 45, 85, 0.8),
                inset 0 0 8px rgba(255, 45, 85, 0.3);
            }
          }
        `}</style>
      )}
    </div>
  );
}
