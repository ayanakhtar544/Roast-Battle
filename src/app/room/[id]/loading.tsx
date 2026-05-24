'use client';

import { motion } from 'motion/react';
import ParticleBackground from '@/components/ui/ParticleBackground';
import GlitchText from '@/components/ui/GlitchText';

export default function RoomLoading() {
  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
        {/* Loading Brain Animation */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotateY: [0, 180, 360],
            boxShadow: [
              '0 0 20px rgba(250, 204, 21, 0.2)',
              '0 0 50px rgba(250, 204, 21, 0.5)',
              '0 0 20px rgba(250, 204, 21, 0.2)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-24 h-24 bg-arena-black border border-arena-yellow/50 rounded-3xl flex items-center justify-center text-4xl mb-8"
        >
          🧠
        </motion.div>

        {/* Cinematic Glitch Loading Title */}
        <GlitchText
          text="LOADING ARENA"
          intensity="medium"
          className="text-4xl md:text-5xl font-black uppercase text-arena-yellow mb-4"
        />

        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Synchronizing timeline channels...
        </p>

        {/* Loading Bar */}
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-8 border border-zinc-800">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-full bg-arena-yellow"
          />
        </div>
      </div>
    </div>
  );
}
