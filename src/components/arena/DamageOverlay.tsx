'use client';

import { type ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/uiStore';

interface DamageOverlayProps {
  children: ReactNode;
}

function getShakeTransform(intensity: 'light' | 'medium' | 'heavy'): {
  x: number[];
  y: number[];
  rotate: number[];
} {
  switch (intensity) {
    case 'light':
      return {
        x: [0, -2, 2, -1, 1, 0],
        y: [0, 1, -1, 1, 0, 0],
        rotate: [0, -0.5, 0.5, -0.3, 0, 0],
      };
    case 'medium':
      return {
        x: [0, -5, 5, -4, 3, -2, 1, 0],
        y: [0, 2, -3, 2, -1, 1, 0, 0],
        rotate: [0, -1, 1.5, -1, 0.5, -0.3, 0, 0],
      };
    case 'heavy':
      return {
        x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0],
        y: [0, 5, -5, 4, -4, 3, -2, 1, -1, 0],
        rotate: [0, -2, 3, -2.5, 2, -1.5, 1, -0.5, 0, 0],
      };
  }
}

function getShakeDuration(intensity: 'light' | 'medium' | 'heavy'): number {
  switch (intensity) {
    case 'light':
      return 0.3;
    case 'medium':
      return 0.4;
    case 'heavy':
      return 0.6;
  }
}

export default function DamageOverlay({ children }: DamageOverlayProps) {
  const screenShake = useUIStore((s) => s.screenShake);
  const shakeIntensity = useUIStore((s) => s.shakeIntensity);
  const damageFlash = useUIStore((s) => s.damageFlash);
  const flashColor = useUIStore((s) => s.flashColor);
  const glitchActive = useUIStore((s) => s.glitchActive);
  const emotionalDamageText = useUIStore((s) => s.emotionalDamageText);

  const shakeTransform = useMemo(() => getShakeTransform(shakeIntensity), [shakeIntensity]);
  const shakeDuration = useMemo(() => getShakeDuration(shakeIntensity), [shakeIntensity]);

  return (
    <div className="relative w-full h-full">
      {/* Main content wrapper with shake + glitch */}
      <motion.div
        className={cn('w-full h-full', glitchActive && 'animate-glitch-distort')}
        animate={
          screenShake
            ? {
                x: shakeTransform.x,
                y: shakeTransform.y,
                rotate: shakeTransform.rotate,
              }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          screenShake
            ? { duration: shakeDuration, ease: 'easeOut' }
            : { duration: 0.15 }
        }
        style={
          glitchActive
            ? {
                filter:
                  'hue-rotate(20deg) saturate(2) contrast(1.2)',
              }
            : undefined
        }
      >
        {children}
      </motion.div>

      {/* Damage flash overlay */}
      <AnimatePresence>
        {damageFlash && (
          <motion.div
            className="fixed inset-0 z-[95] pointer-events-none"
            style={{ backgroundColor: flashColor }}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Glitch overlay lines */}
      <AnimatePresence>
        {glitchActive && (
          <motion.div
            className="fixed inset-0 z-[96] pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
          >
            {/* Scan lines */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
              }}
            />
            {/* Color split strips */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`glitch-strip-${i}`}
                className="absolute w-full"
                style={{
                  height: `${8 + Math.random() * 12}px`,
                  top: `${20 + i * 25 + Math.random() * 10}%`,
                  background:
                    i % 2 === 0
                      ? 'rgba(255, 45, 85, 0.15)'
                      : 'rgba(34, 211, 238, 0.15)',
                }}
                animate={{
                  x: [0, -15, 10, -5, 0],
                  opacity: [0, 1, 0.7, 1, 0],
                }}
                transition={{
                  duration: 0.25,
                  delay: i * 0.03,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emotional damage text popup */}
      <AnimatePresence>
        {emotionalDamageText && (
          <motion.div
            className="fixed inset-0 z-[97] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 20,
              }}
            >
              <span
                className="text-5xl md:text-7xl font-black uppercase tracking-tight text-center leading-none select-none"
                style={{
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #ff2d55 60%, #ff6b35 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter:
                    'drop-shadow(0 0 30px rgba(255, 45, 85, 0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
                }}
              >
                {emotionalDamageText}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glitch CSS keyframes */}
      <style jsx global>{`
        @keyframes glitch-distort {
          0% {
            clip-path: inset(0 0 0 0);
            transform: translate(0);
          }
          20% {
            clip-path: inset(10% 0 60% 0);
            transform: translate(-3px, 2px);
          }
          40% {
            clip-path: inset(40% 0 30% 0);
            transform: translate(3px, -1px);
          }
          60% {
            clip-path: inset(70% 0 10% 0);
            transform: translate(-2px, 1px);
          }
          80% {
            clip-path: inset(20% 0 50% 0);
            transform: translate(1px, -2px);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translate(0);
          }
        }
        .animate-glitch-distort {
          animation: glitch-distort 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
