'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface FaceCamProps {
  stream: MediaStream | null;
  playerName: string;
  isLocal?: boolean;
  hp: number;
  isSpeaking?: boolean;
  playerColor?: 'yellow' | 'cyan';
  className?: string;
}

export function FaceCam({
  stream,
  playerName,
  isLocal = false,
  hp,
  isSpeaking = false,
  playerColor = 'yellow',
  className,
}: FaceCamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const borderColor = playerColor === 'yellow' ? 'border-arena-yellow' : 'border-arena-cyan';
  const glowClass = playerColor === 'yellow' ? 'shadow-neon-yellow' : 'shadow-neon-cyan';
  const speakingGlow = playerColor === 'yellow'
    ? '0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(250,204,21,0.3)'
    : '0 0 30px rgba(34,211,238,0.6), 0 0 60px rgba(34,211,238,0.3)';

  const hpColor = hp > 60 ? 'bg-arena-neon' : hp > 30 ? 'bg-arena-yellow' : 'bg-arena-red';
  const hpTrack = hp <= 20 ? 'animate-pulse-fast' : '';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative rounded-2xl overflow-hidden border-2 transition-all duration-300',
        borderColor,
        isSpeaking ? '' : glowClass,
        className
      )}
      style={isSpeaking ? { boxShadow: speakingGlow } : undefined}
    >
      {/* Video feed */}
      <div className="relative aspect-[4/3] bg-arena-dark">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
            style={{ transform: isLocal ? 'scaleX(-1)' : undefined }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-arena-dark to-black/80">
            <div className="text-4xl mb-2">
              {isLocal ? '📷' : '👤'}
            </div>
            <p className="text-[10px] text-white/30 font-bold uppercase">
              {isLocal ? 'Enable Camera' : 'Waiting...'}
            </p>
          </div>
        )}

        {/* LIVE indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-arena-red animate-pulse" />
          <span className="text-[9px] font-black text-white/80 uppercase">LIVE</span>
        </div>

        {/* Player name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
          <div className="flex items-center justify-between">
            <span className={cn(
              'text-xs font-black uppercase tracking-wider',
              playerColor === 'yellow' ? 'text-arena-yellow' : 'text-arena-cyan'
            )}>
              {playerName}
              {isLocal && <span className="text-white/30 ml-1">(YOU)</span>}
            </span>
            <span className="text-[10px] font-bold text-white/50">{hp}%</span>
          </div>

          {/* HP Bar */}
          <div className={cn('mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden', hpTrack)}>
            <motion.div
              className={cn('h-full rounded-full transition-colors duration-500', hpColor)}
              initial={{ width: '100%' }}
              animate={{ width: `${hp}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
        </div>

        {/* KO Overlay */}
        {hp === 0 && (
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <span className="text-5xl font-black text-arena-red neon-text-red animate-pulse">
              K.O.
            </span>
          </motion.div>
        )}

        {/* Speaking indicator border pulse */}
        {isSpeaking && (
          <div className="absolute inset-0 border-2 border-white/30 rounded-2xl animate-pulse pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
}
