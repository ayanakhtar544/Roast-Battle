'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useBattleStore } from '@/stores/battleStore';
import { useUIStore } from '@/stores/uiStore';

interface BattleHeaderProps {
  roomCode: string;
  onShare?: () => void;
  onMute?: () => void;
}

export default function BattleHeader({ roomCode, onShare, onMute }: BattleHeaderProps) {
  const battlePhase = useBattleStore((s) => s.battlePhase);
  const currentRound = useBattleStore((s) => s.currentRound);
  const totalRounds = useBattleStore((s) => s.totalRounds);
  const players = useBattleStore((s) => s.players);
  const isMuted = useUIStore((s) => s.isMuted);
  const toggleMute = useUIStore((s) => s.toggleMute);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      setCopied(false);
    }
  }, [roomCode]);

  const handleMute = useCallback(() => {
    toggleMute();
    onMute?.();
  }, [toggleMute, onMute]);

  const phaseLabel: Record<string, string> = {
    lobby: 'LOBBY',
    countdown: 'STARTING',
    battle: 'BATTLE',
    judging: 'JUDGING',
    results: 'RESULTS',
  };

  const isLive = battlePhase === 'battle' || battlePhase === 'judging';

  return (
    <motion.header
      className={cn(
        'relative z-50 w-full px-4 py-2',
        'bg-white/[0.04] backdrop-blur-xl',
        'border-b border-white/[0.08]',
        'flex items-center justify-between gap-3'
      )}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
    >
      {/* Left section: Room code + Live badge */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Room code — copyable */}
        <button
          onClick={handleCopyCode}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md',
            'bg-white/[0.06] hover:bg-white/[0.1] transition-colors',
            'border border-white/[0.08]',
            'cursor-pointer group'
          )}
          title="Copy room code"
        >
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Room</span>
          <span className="text-xs font-mono font-bold text-yellow-400 tracking-wider">
            {roomCode}
          </span>
          <span className="text-[10px] text-white/30 group-hover:text-white/60 transition-colors">
            {copied ? '✓' : '📋'}
          </span>
        </button>

        {/* LIVE badge */}
        {isLive && (
          <motion.div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
              Live
            </span>
          </motion.div>
        )}
      </div>

      {/* Center section: Phase + Round */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04]">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Phase</span>
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              battlePhase === 'battle' && 'text-red-400',
              battlePhase === 'judging' && 'text-yellow-400',
              battlePhase === 'results' && 'text-green-400',
              battlePhase === 'lobby' && 'text-cyan-400',
              battlePhase === 'countdown' && 'text-purple-400'
            )}
          >
            {phaseLabel[battlePhase] ?? battlePhase.toUpperCase()}
          </span>
        </div>

        {totalRounds > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04]">
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Round</span>
            <span className="text-xs font-mono font-bold text-white/90">
              {currentRound}
              <span className="text-white/30">/{totalRounds}</span>
            </span>
          </div>
        )}
      </div>

      {/* Right section: Players + controls */}
      <div className="flex items-center gap-2">
        {/* Player count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04]">
          <span className="text-xs">👥</span>
          <span className="text-xs font-mono font-bold text-white/80">
            {players.length}
          </span>
        </div>

        {/* Mute button */}
        <button
          onClick={handleMute}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-md',
            'bg-white/[0.06] hover:bg-white/[0.1] transition-colors',
            'border border-white/[0.08]',
            'cursor-pointer text-sm',
            isMuted && 'text-red-400'
          )}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Share button */}
        {onShare && (
          <button
            onClick={onShare}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md',
              'bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors',
              'border border-yellow-400/20',
              'cursor-pointer'
            )}
          >
            <span className="text-xs">🔗</span>
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
              Share
            </span>
          </button>
        )}
      </div>
    </motion.header>
  );
}
