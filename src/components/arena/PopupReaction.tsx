'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/stores/uiStore';
import type { PopupReaction as PopupReactionType } from '@/stores/uiStore';

function PopupItem({ popup }: { popup: PopupReactionType }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${popup.x}%`,
        top: `${popup.y}%`,
      }}
      initial={{
        opacity: 0,
        scale: 0.3,
        y: 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.3, 1.2, 1, 0.8],
        y: [0, -10, -40, -80],
      }}
      exit={{
        opacity: 0,
        scale: 0.5,
        y: -100,
      }}
      transition={{
        duration: 2.2,
        ease: 'easeOut',
        times: [0, 0.15, 0.6, 1],
      }}
    >
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-2xl">{popup.emoji}</span>
        <span
          className="text-sm font-black uppercase tracking-wider text-white"
          style={{
            textShadow: `0 0 10px ${popup.color}, 0 0 20px ${popup.color}66, 0 2px 4px rgba(0,0,0,0.8)`,
          }}
        >
          {popup.text}
        </span>
      </div>
    </motion.div>
  );
}

export default function PopupReaction() {
  const popupQueue = useUIStore((s) => s.popupQueue);

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {popupQueue.slice(0, 5).map((popup) => (
          <PopupItem key={popup.id} popup={popup} />
        ))}
      </AnimatePresence>
    </div>
  );
}
