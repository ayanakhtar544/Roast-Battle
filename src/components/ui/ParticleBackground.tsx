'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface ParticleBackgroundProps {
  className?: string;
  /** Number of particles to render (default: 50) */
  particleCount?: number;
  /** Disable animation (for reduced motion preference) */
  paused?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  /** Horizontal drift oscillation offset */
  driftPhase: number;
  driftSpeed: number;
  driftAmount: number;
  color: string;
  /** 0 = circle, 1 = diamond */
  shape: number;
  opacity: number;
}

const EMBER_COLORS = [
  '#ff6b35', // fire orange
  '#ff2d55', // hot red
  '#facc15', // gold
  '#ff8c42', // amber
  '#e63946', // crimson
  '#ffb347', // light orange
  '#f4a261', // sandy orange
  '#ff4500', // orange-red
];

function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: canvasHeight + Math.random() * 40, // start below viewport
    size: 1 + Math.random() * 2.5,
    speedY: 0.3 + Math.random() * 0.8,
    speedX: (Math.random() - 0.5) * 0.15,
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: 0.005 + Math.random() * 0.015,
    driftAmount: 0.3 + Math.random() * 0.6,
    color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
    shape: Math.random() > 0.65 ? 1 : 0,
    opacity: 0.2 + Math.random() * 0.6,
  };
}

export default function ParticleBackground({
  className,
  particleCount = 50,
  paused = false,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
    }

    resize();

    // Initialize particles
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(rect.width, rect.height),
    );

    // Scatter initial Y positions for a natural look on mount
    for (const p of particlesRef.current) {
      p.y = Math.random() * rect.height;
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        if (!paused) {
          // Update position
          p.y -= p.speedY;
          p.x += p.speedX + Math.sin(p.driftPhase) * p.driftAmount * 0.1;
          p.driftPhase += p.driftSpeed;

          // Reset when particle exits top
          if (p.y < -10) {
            Object.assign(p, createParticle(w, h));
          }

          // Wrap horizontal
          if (p.x < -5) p.x = w + 5;
          if (p.x > w + 5) p.x = -5;
        }

        // Calculate opacity: fade in at bottom 15%, fade out at top 15%
        const bottomFade = Math.min(1, (h - p.y) / (h * 0.15));
        const topFade = Math.min(1, p.y / (h * 0.15));
        const alpha = p.opacity * Math.min(bottomFade, topFade);

        if (alpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 1) {
          // Diamond shape
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // Circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particleCount, paused]);

  return (
    <div
      className={cn('pointer-events-none fixed inset-0 -z-10', className)}
      aria-hidden="true"
    >
      {/* Radial gradient overlay — dark center, purple edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(26, 10, 46, 0.4) 70%, rgba(15, 5, 30, 0.6) 100%)',
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
