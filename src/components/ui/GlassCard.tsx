'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Enable colored glow shadow around the card */
  glow?: boolean;
  /** Custom glow color — pass a CSS color string, e.g. '#facc15' or 'rgba(168,85,247,0.4)' */
  glowColor?: string;
  /** Enable hover lift + scale animation */
  hover?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const DEFAULT_GLOW_COLOR = 'rgba(250, 204, 21, 0.15)';

export default function GlassCard({
  children,
  className,
  glow = false,
  glowColor,
  hover = false,
  style,
  onClick,
}: GlassCardProps) {
  const resolvedGlowColor = glowColor ?? DEFAULT_GLOW_COLOR;

  // Parse the glow color to generate shadow layers
  const glowShadow = glow
    ? `0 0 20px ${resolvedGlowColor}, 0 0 50px ${resolvedGlowColor}, 0 4px 30px rgba(0,0,0,0.3)`
    : undefined;

  return (
    <motion.div
      className={cn(
        // Glassmorphism base
        'rounded-2xl',
        'bg-white/[0.03]',
        'backdrop-blur-xl',
        'border border-white/[0.08]',
        // Smooth transitions
        'transition-all duration-300 ease-out',
        className,
      )}
      style={{
        ...style,
        boxShadow: glowShadow,
        WebkitBackdropFilter: 'blur(24px)',
      }}
      // Hover lift animation
      whileHover={
        hover
          ? {
              y: -6,
              scale: 1.02,
              boxShadow: glow
                ? `0 0 30px ${resolvedGlowColor}, 0 0 70px ${resolvedGlowColor}, 0 12px 40px rgba(0,0,0,0.4)`
                : '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
