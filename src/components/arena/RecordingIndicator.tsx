'use client';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/uiStore';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function RecordingIndicator() {
  const isRecording = useUIStore((s) => s.isRecording);
  const recordingDuration = useUIStore((s) => s.recordingDuration);

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          className={cn(
            'fixed top-4 right-4 z-[80]',
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-black/40 backdrop-blur-md',
            'border border-white/[0.08]'
          )}
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Pulsing red dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>

          {/* REC label */}
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
            REC
          </span>

          {/* Divider */}
          <div className="w-px h-3 bg-white/10" />

          {/* Timer */}
          <span className="text-xs font-mono font-bold text-white/70 tabular-nums">
            {formatDuration(recordingDuration)}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
