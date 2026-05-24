'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import ParticleBackground from '@/components/ui/ParticleBackground';
import GlitchText from '@/components/ui/GlitchText';
import NeonButton from '@/components/ui/NeonButton';

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Room boundary error encountered:', error);
  }, [error]);

  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
        {/* Sarcastic Error Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="w-24 h-24 bg-arena-black border border-arena-red/50 rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-[0_0_40px_rgba(255,45,85,0.25)]"
        >
          💀
        </motion.div>

        {/* Glitch Error Title */}
        <GlitchText
          text="CRITICAL COLLAPSE"
          intensity="intense"
          className="text-4xl md:text-5xl font-black uppercase text-arena-red mb-4"
        />

        <h3 className="text-zinc-300 font-bold text-lg mb-6 leading-relaxed">
          The battle crashed under extreme emotional weight.
        </h3>

        <div className="bg-arena-black/60 border border-zinc-800 rounded-2xl p-4 w-full mb-8 font-mono text-left text-xs text-arena-red overflow-x-auto max-h-40 whitespace-pre-wrap">
          {error.message || 'Unknown arena timeline distortion.'}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <NeonButton
            variant="danger"
            size="lg"
            className="font-black uppercase tracking-wider text-xs"
            onClick={reset}
          >
            REVIVE TIMELINE (RETRY) ⚡
          </NeonButton>
          <a
            href="/"
            className="px-6 py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center"
          >
            RETREAT TO LOBBY
          </a>
        </div>
      </div>
    </div>
  );
}
