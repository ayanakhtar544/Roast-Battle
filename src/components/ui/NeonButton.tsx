'use client';

import { useRef, useCallback, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

type NeonVariant = 'fire' | 'ice' | 'toxic' | 'purple' | 'danger';
type NeonSize = 'sm' | 'md' | 'lg' | 'xl';

interface NeonButtonProps {
  variant?: NeonVariant;
  size?: NeonSize;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  /** Enable ripple effect on click */
  ripple?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

const variantStyles: Record<
  NeonVariant,
  {
    bg: string;
    hoverBg: string;
    text: string;
    border: string;
    glow: string;
    hoverGlow: string;
    loadingGlow: string;
    rgb: string;
  }
> = {
  fire: {
    bg: 'bg-[#facc15]',
    hoverBg: 'hover:bg-yellow-300',
    text: 'text-black',
    border: 'border-b-yellow-600',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.2)]',
    hoverGlow:
      'hover:shadow-[0_0_24px_rgba(250,204,21,0.4),0_0_48px_rgba(250,204,21,0.15)]',
    loadingGlow: 'shadow-[0_0_24px_rgba(250,204,21,0.5),0_0_60px_rgba(250,204,21,0.2)]',
    rgb: '250,204,21',
  },
  ice: {
    bg: 'bg-[#22d3ee]',
    hoverBg: 'hover:bg-cyan-300',
    text: 'text-black',
    border: 'border-b-cyan-700',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.2)]',
    hoverGlow:
      'hover:shadow-[0_0_24px_rgba(34,211,238,0.4),0_0_48px_rgba(34,211,238,0.15)]',
    loadingGlow: 'shadow-[0_0_24px_rgba(34,211,238,0.5),0_0_60px_rgba(34,211,238,0.2)]',
    rgb: '34,211,238',
  },
  toxic: {
    bg: 'bg-[#39ff14]',
    hoverBg: 'hover:bg-green-300',
    text: 'text-black',
    border: 'border-b-green-700',
    glow: 'shadow-[0_0_12px_rgba(57,255,20,0.2)]',
    hoverGlow:
      'hover:shadow-[0_0_24px_rgba(57,255,20,0.4),0_0_48px_rgba(57,255,20,0.15)]',
    loadingGlow: 'shadow-[0_0_24px_rgba(57,255,20,0.5),0_0_60px_rgba(57,255,20,0.2)]',
    rgb: '57,255,20',
  },
  purple: {
    bg: 'bg-[#a855f7]',
    hoverBg: 'hover:bg-purple-400',
    text: 'text-white',
    border: 'border-b-purple-800',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    hoverGlow:
      'hover:shadow-[0_0_24px_rgba(168,85,247,0.4),0_0_48px_rgba(168,85,247,0.15)]',
    loadingGlow: 'shadow-[0_0_24px_rgba(168,85,247,0.5),0_0_60px_rgba(168,85,247,0.2)]',
    rgb: '168,85,247',
  },
  danger: {
    bg: 'bg-[#ff2d55]',
    hoverBg: 'hover:bg-red-400',
    text: 'text-white',
    border: 'border-b-red-800',
    glow: 'shadow-[0_0_12px_rgba(255,45,85,0.2)]',
    hoverGlow:
      'hover:shadow-[0_0_24px_rgba(255,45,85,0.4),0_0_48px_rgba(255,45,85,0.15)]',
    loadingGlow: 'shadow-[0_0_24px_rgba(255,45,85,0.5),0_0_60px_rgba(255,45,85,0.2)]',
    rgb: '255,45,85',
  },
};

const sizeStyles: Record<NeonSize, string> = {
  sm: 'px-4 py-2 text-xs rounded-lg border-b-[3px] active:border-b-0 active:translate-y-[3px]',
  md: 'px-6 py-3 text-sm rounded-xl border-b-[4px] active:border-b-0 active:translate-y-[4px]',
  lg: 'px-8 py-4 text-base rounded-xl border-b-[5px] active:border-b-0 active:translate-y-[5px]',
  xl: 'px-10 py-5 text-lg rounded-2xl border-b-[6px] active:border-b-0 active:translate-y-[6px]',
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function NeonButton({
  variant = 'fire',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className,
  ripple = true,
  onClick,
  style,
}: NeonButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      // Ripple effect
      if (ripple && buttonRef.current) {
        const btn = buttonRef.current;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rippleEl = document.createElement('span');

        rippleEl.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(${styles.rgb}, 0.4);
          transform: translate(-50%, -50%);
          pointer-events: none;
          animation: neon-ripple 0.6s ease-out forwards;
        `;

        btn.appendChild(rippleEl);
        setTimeout(() => rippleEl.remove(), 600);
      }

      onClick?.(e);
    },
    [disabled, loading, ripple, onClick, styles.rgb],
  );

  const isDisabled = disabled || loading;

  return (
    <>
      <style jsx={false}>{`
        @keyframes neon-ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
      `}</style>
      <motion.button
        ref={buttonRef}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          // Base styles
          'relative overflow-hidden font-black uppercase tracking-wider',
          'transition-all duration-200 ease-out',
          'select-none cursor-pointer',
          // Disabled styles
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'disabled:active:translate-y-0',
          // Size
          sizeStyles[size],
          // Variant colors
          styles.bg,
          styles.text,
          styles.border,
          styles.glow,
          !isDisabled && styles.hoverBg,
          !isDisabled && styles.hoverGlow,
          // Loading pulsing glow
          loading && styles.loadingGlow,
          loading && 'animate-pulse-glow',
          className,
        )}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        style={style}
      >
        <span
          className={cn(
            'relative z-10 flex items-center justify-center gap-2',
            loading && 'opacity-70',
          )}
        >
          {loading && <Spinner className="shrink-0" />}
          {children}
        </span>
      </motion.button>
    </>
  );
}
