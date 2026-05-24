'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

type GlitchIntensity = 'subtle' | 'medium' | 'intense';
type GlitchElement = 'h1' | 'h2' | 'h3' | 'span' | 'p';

interface GlitchTextProps {
  text: string;
  intensity?: GlitchIntensity;
  className?: string;
  as?: GlitchElement;
  /** Continuously animate the glitch effect */
  animate?: boolean;
}

const intensityConfig: Record<
  GlitchIntensity,
  { offset: string; duration: string; clipOffset: string }
> = {
  subtle: {
    offset: '1px',
    duration: '4s',
    clipOffset: '1px',
  },
  medium: {
    offset: '2px',
    duration: '2.5s',
    clipOffset: '2px',
  },
  intense: {
    offset: '4px',
    duration: '1.5s',
    clipOffset: '4px',
  },
};

export default function GlitchText({
  text,
  intensity = 'medium',
  className,
  as: Tag = 'span',
  animate = true,
}: GlitchTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = intensityConfig[intensity];

  // One-time glitch burst on hover when not animating
  const triggerGlitch = useCallback(() => {
    const el = containerRef.current;
    if (!el || animate) return;
    el.classList.remove('glitch-active');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('glitch-active');
    const timeout = setTimeout(() => el.classList.remove('glitch-active'), 600);
    return () => clearTimeout(timeout);
  }, [animate]);

  const MotionTag = motion.create(Tag);

  return (
    <>
      <style jsx={false}>{`
        .glitch-container {
          --glitch-offset: ${config.offset};
          --glitch-clip-offset: ${config.clipOffset};
          --glitch-duration: ${config.duration};
        }

        .glitch-layer {
          position: relative;
          display: inline-block;
        }

        .glitch-layer::before,
        .glitch-layer::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .glitch-layer::before {
          color: #22d3ee;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          transform: translateX(calc(var(--glitch-offset) * -1));
          opacity: 0;
        }

        .glitch-layer::after {
          color: #ff2d55;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          transform: translateX(var(--glitch-offset));
          opacity: 0;
        }

        /* Continuous animation mode */
        .glitch-animate .glitch-layer::before {
          animation: glitch-before var(--glitch-duration) infinite;
        }

        .glitch-animate .glitch-layer::after {
          animation: glitch-after var(--glitch-duration) infinite;
          animation-delay: calc(var(--glitch-duration) * 0.1);
        }

        /* One-time trigger mode */
        .glitch-active .glitch-layer::before {
          animation: glitch-before 0.6s ease-in-out;
        }

        .glitch-active .glitch-layer::after {
          animation: glitch-after 0.6s ease-in-out;
          animation-delay: 0.05s;
        }

        @keyframes glitch-before {
          0%, 100% {
            opacity: 0;
            transform: translateX(0);
            clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          }
          5% {
            opacity: 0.8;
            transform: translateX(calc(var(--glitch-clip-offset) * -1));
          }
          10% {
            clip-path: polygon(0 15%, 100% 15%, 100% 50%, 0 50%);
            transform: translateX(var(--glitch-clip-offset));
          }
          15% {
            opacity: 0.6;
            transform: translateX(calc(var(--glitch-clip-offset) * -0.5));
            clip-path: polygon(0 40%, 100% 40%, 100% 60%, 0 60%);
          }
          20% {
            opacity: 0.8;
            transform: translateX(var(--glitch-clip-offset));
            clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
          }
          25% {
            opacity: 0;
            transform: translateX(0);
          }
          50% {
            opacity: 0;
          }
          52% {
            opacity: 0.7;
            transform: translateX(calc(var(--glitch-clip-offset) * 1.5));
            clip-path: polygon(0 55%, 100% 55%, 100% 75%, 0 75%);
          }
          54% {
            opacity: 0.5;
            transform: translateX(calc(var(--glitch-clip-offset) * -1));
            clip-path: polygon(0 20%, 100% 20%, 100% 45%, 0 45%);
          }
          56% {
            opacity: 0;
            transform: translateX(0);
          }
        }

        @keyframes glitch-after {
          0%, 100% {
            opacity: 0;
            transform: translateX(0);
            clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          }
          5% {
            opacity: 0.8;
            transform: translateX(var(--glitch-clip-offset));
          }
          10% {
            clip-path: polygon(0 50%, 100% 50%, 100% 80%, 0 80%);
            transform: translateX(calc(var(--glitch-clip-offset) * -1));
          }
          15% {
            opacity: 0.6;
            transform: translateX(calc(var(--glitch-clip-offset) * 0.8));
            clip-path: polygon(0 70%, 100% 70%, 100% 90%, 0 90%);
          }
          20% {
            opacity: 0.8;
            transform: translateX(calc(var(--glitch-clip-offset) * -0.5));
            clip-path: polygon(0 80%, 100% 80%, 100% 100%, 0 100%);
          }
          25% {
            opacity: 0;
            transform: translateX(0);
          }
          45% {
            opacity: 0;
          }
          47% {
            opacity: 0.6;
            transform: translateX(calc(var(--glitch-clip-offset) * -1.5));
            clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%);
          }
          49% {
            opacity: 0.4;
            transform: translateX(var(--glitch-clip-offset));
            clip-path: polygon(0 60%, 100% 60%, 100% 85%, 0 85%);
          }
          51% {
            opacity: 0;
            transform: translateX(0);
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className={cn('glitch-container', animate && 'glitch-animate')}
        onMouseEnter={triggerGlitch}
      >
        <MotionTag
          data-text={text}
          className={cn('glitch-layer', className)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {text}
        </MotionTag>
      </div>
    </>
  );
}
