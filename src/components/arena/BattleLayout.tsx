'use client';

import { ReactNode } from 'react';
import ParticleBackground from '@/components/ui/ParticleBackground';

interface BattleLayoutProps {
  children: ReactNode;
}

export default function BattleLayout({ children }: BattleLayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-arena-black text-white overflow-x-hidden font-sans select-none">
      {/* Background VFX */}
      <ParticleBackground />
      
      {/* Cybersecurity matrix neon lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(250,204,21,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(250,204,21,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      
      {/* Soft color spotlights */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-arena-yellow/5 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-arena-purple/5 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Grid container wrapper */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto min-h-screen p-4 flex flex-col">
        <div className="grid grid-cols-12 gap-4 flex-1 items-stretch">
          {children}
        </div>
      </div>
    </div>
  );
}
