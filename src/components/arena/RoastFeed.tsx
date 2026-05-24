'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import type { Roast } from '@/stores/battleStore';

interface RoastFeedProps {
  roasts: Roast[];
  myName: string;
  className?: string;
}

function ScoreBadge({ score }: { score: number }) {
  const fires = score >= 8 ? '🔥🔥🔥' : score >= 6 ? '🔥🔥' : score >= 4 ? '🔥' : '💨';
  const bgColor = score >= 8 ? 'bg-arena-red/20 border-arena-red/30 text-arena-red' :
    score >= 6 ? 'bg-arena-fire/20 border-arena-fire/30 text-arena-fire' :
    score >= 4 ? 'bg-arena-yellow/20 border-arena-yellow/30 text-arena-yellow' :
    'bg-white/5 border-white/10 text-white/40';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black', bgColor)}>
      {fires} {score}/10
    </span>
  );
}

export function RoastFeed({ roasts, myName, className }: RoastFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roasts]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto p-3 md:p-4 space-y-3',
        'bg-gradient-to-b from-black/10 to-black/40',
        'no-scrollbar',
        className
      )}
    >
      {roasts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-8">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="text-white/20 text-sm font-bold uppercase tracking-wider">
            No roasts yet
          </p>
          <p className="text-white/10 text-xs mt-1">
            Be the first to attack
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {roasts.map((roast, idx) => {
          const isMe = roast.sender === myName;
          const isHighScore = (roast.aiScore ?? 0) >= 8;

          return (
            <motion.div
              key={roast.id || idx}
              initial={{
                opacity: 0,
                x: isMe ? 30 : -30,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              className={cn(
                'flex flex-col',
                isMe ? 'items-end' : 'items-start'
              )}
            >
              {/* Sender label */}
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-widest mb-1 px-2',
                isMe ? 'text-arena-yellow/60' : 'text-arena-cyan/60'
              )}>
                {isMe ? 'YOU' : roast.sender}
              </span>

              {/* Message bubble */}
              <div className={cn(
                'relative max-w-[85%] px-4 py-3 rounded-2xl font-semibold text-sm',
                'border-b-[3px] transition-all',
                isMe
                  ? 'bg-arena-yellow text-black rounded-br-sm border-yellow-600'
                  : 'bg-zinc-800/80 text-white rounded-bl-sm border-zinc-900',
                isHighScore && 'animate-fire-border ring-1 ring-arena-fire/30'
              )}>
                {roast.text}

                {/* Audio playback */}
                {roast.audioData && (
                  <audio
                    controls
                    src={roast.audioData}
                    className="mt-2 h-8 w-full opacity-80 rounded-lg"
                  />
                )}
              </div>

              {/* AI Reaction + Score */}
              {roast.aiScore !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center gap-2 mt-1 px-1',
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <ScoreBadge score={roast.aiScore} />
                  {roast.aiReaction && (
                    <span className="text-[10px] text-white/30 font-medium italic max-w-[200px] truncate">
                      "{roast.aiReaction}"
                    </span>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
