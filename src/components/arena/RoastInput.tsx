'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface RoastInputProps {
  onSubmit: (text: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function RoastInput({
  onSubmit,
  onTyping,
  disabled = false,
  placeholder = 'TYPE YOUR ROAST...',
  className,
}: RoastInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxChars = 280;

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    setIsSubmitting(true);
    onSubmit(trimmed);
    setText('');
    setTimeout(() => setIsSubmitting(false), 300);
    inputRef.current?.focus();
  }, [text, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= maxChars) {
      setText(val);
      onTyping?.();
    }
  };

  const charPercent = (text.length / maxChars) * 100;
  const charColor = charPercent > 90 ? 'text-arena-red' : charPercent > 70 ? 'text-arena-yellow' : 'text-white/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative', className)}
    >
      <div className={cn(
        'flex items-center gap-2 p-2 bg-black/40 backdrop-blur-sm rounded-2xl',
        'border border-white/5 transition-all',
        text.length > 0 && 'border-arena-yellow/20 shadow-[0_0_15px_rgba(250,204,21,0.05)]',
        isSubmitting && 'scale-[0.99]',
      )}>
        {/* Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={cn(
              'w-full bg-transparent text-white font-semibold px-4 py-3',
              'focus:outline-none placeholder:text-white/15 text-sm md:text-base',
              'disabled:opacity-30 disabled:cursor-not-allowed uppercase',
            )}
          />
        </div>

        {/* Char counter */}
        <span className={cn('text-[10px] font-mono font-bold mr-1', charColor)}>
          {text.length}/{maxChars}
        </span>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className={cn(
            'px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all',
            'bg-arena-yellow text-black hover:bg-yellow-300',
            'border-b-[4px] border-yellow-700 active:border-b-0 active:translate-y-[4px]',
            'disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-arena-yellow',
            isSubmitting && 'animate-scale-in'
          )}
        >
          🔥
        </button>
      </div>

      {/* Typing indicator glow line */}
      {text.length > 0 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-arena-yellow/40 to-transparent"
        />
      )}
    </motion.div>
  );
}
