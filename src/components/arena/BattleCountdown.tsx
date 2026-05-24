'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/stores/uiStore';

export default function BattleCountdown() {
  const showCountdown = useUIStore((s) => s.showCountdown);
  const countdownValue = useUIStore((s) => s.countdownValue);

  return (
    <AnimatePresence>
      {showCountdown && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Countdown numbers */}
          <AnimatePresence mode="wait">
            {countdownValue > 0 ? (
              <motion.div
                key={`count-${countdownValue}`}
                className="relative z-10 select-none"
                initial={{ scale: 3, opacity: 0, filter: 'blur(8px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 0.5, opacity: 0, filter: 'blur(4px)' }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span
                  className="text-[12rem] font-black tabular-nums leading-none"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #ffffff88 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                    filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.3))',
                  }}
                >
                  {countdownValue}
                </span>

                {/* Ring burst effect */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <div
                    className="w-40 h-40 rounded-full border-2 border-white/30"
                  />
                </motion.div>
              </motion.div>
            ) : (
              /* ROAST! text at 0 */
              <motion.div
                key="roast-go"
                className="relative z-10 select-none"
                initial={{ scale: 0, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 3, opacity: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <span
                  className="text-[10rem] font-black uppercase leading-none tracking-tight"
                  style={{
                    background:
                      'linear-gradient(180deg, #facc15 0%, #ff6b35 40%, #ff2d55 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter:
                      'drop-shadow(0 0 60px rgba(255, 107, 53, 0.6)) drop-shadow(0 0 120px rgba(255, 45, 85, 0.3))',
                  }}
                >
                  ROAST!
                </span>

                {/* Explosion rings */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={`ring-${i}`}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ scale: 0.5, opacity: 0.6 }}
                    animate={{ scale: 3 + i * 0.5, opacity: 0 }}
                    transition={{
                      duration: 0.8 + i * 0.15,
                      delay: i * 0.08,
                      ease: 'easeOut',
                    }}
                  >
                    <div
                      className="w-48 h-48 rounded-full"
                      style={{
                        border: `2px solid rgba(255, ${107 - i * 30}, ${53 - i * 15}, 0.5)`,
                      }}
                    />
                  </motion.div>
                ))}

                {/* Particle sparks */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const distance = 200;
                  return (
                    <motion.div
                      key={`spark-${i}`}
                      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-yellow-400 pointer-events-none"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{
                        duration: 0.7,
                        delay: 0.1,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
