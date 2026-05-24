'use client';

import YouTube from 'react-youtube';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface YouTubePlayerProps {
  videoId: string;
  onReady?: (event: any) => void;
  onPlay?: (event: any) => void;
  onPause?: (event: any) => void;
  onEnd?: (event: any) => void;
  roundNumber?: number;
  totalRounds?: number;
  className?: string;
}

export function YouTubePlayer({
  videoId,
  onReady,
  onPlay,
  onPause,
  onEnd,
  roundNumber,
  totalRounds,
  className,
}: YouTubePlayerProps) {
  const playerOptions = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'relative rounded-2xl overflow-hidden border-2 border-white/10',
        'shadow-[0_0_40px_rgba(0,0,0,0.8)]',
        className
      )}
    >
      {/* Neon frame glow */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-arena-yellow/20 via-arena-fire/20 to-arena-yellow/20 rounded-2xl blur-sm pointer-events-none z-0" />

      {/* Video container */}
      <div className="relative z-10 bg-black aspect-[9/16] max-h-[60vh] flex items-center justify-center">
        <YouTube
          key={videoId}
          videoId={videoId}
          opts={playerOptions}
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          onEnd={onEnd}
          className="absolute inset-0 w-full h-full flex justify-center"
          iframeClassName="w-full h-full max-w-[400px] object-cover"
        />
      </div>

      {/* Round overlay */}
      {roundNumber !== undefined && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
            <span className="text-arena-yellow font-black text-xs uppercase tracking-wider">
              ROUND {roundNumber}
              {totalRounds ? ` / ${totalRounds}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* NOW WATCHING label */}
      <div className="absolute top-3 right-3 z-20">
        <div className="flex items-center gap-1.5 bg-arena-red/20 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-arena-red/30">
          <span className="w-1.5 h-1.5 rounded-full bg-arena-red animate-pulse" />
          <span className="text-[9px] font-black text-arena-red uppercase">NOW WATCHING</span>
        </div>
      </div>
    </motion.div>
  );
}
