'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/cn';

// ===== PARTICLE BACKGROUND (inline for landing) =====
function LandingParticles() {
  useEffect(() => {
    const canvas = document.getElementById('landing-particles') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number; size: number; speedY: number; speedX: number;
      opacity: number; color: string; life: number; maxLife: number;
    }

    const colors = ['#ff2d55', '#ff6b35', '#facc15', '#a855f7', '#ff2d55'];
    const particles: Particle[] = [];

    const spawn = () => {
      if (particles.length > 50) return;
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        size: 1 + Math.random() * 2.5,
        speedY: -(0.3 + Math.random() * 1.2),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: 0.3 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 200 + Math.random() * 300,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.3) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;
        const progress = p.life / p.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : progress > 0.8 ? (1 - progress) * 5 : 1;

        ctx.globalAlpha = p.opacity * alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.globalAlpha = p.opacity * alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife || p.y < -10) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      id="landing-particles"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

// ===== GLITCH TITLE =====
function GlitchTitle() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <h1
        className={cn(
          'text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase',
          'bg-gradient-to-r from-white via-arena-yellow to-arena-fire bg-clip-text text-transparent',
          'drop-shadow-2xl select-none',
          glitch && 'animate-glitch'
        )}
      >
        ROAST
        <br />
        <span className="text-arena-yellow neon-text-yellow">ARENA</span>
      </h1>

      {/* Glitch layers */}
      {glitch && (
        <>
          <div className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase text-arena-cyan opacity-70"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 33%, 0 33%)', transform: 'translateX(-3px)' }}>
            ROAST<br /><span>ARENA</span>
          </div>
          <div className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase text-arena-red opacity-70"
            style={{ clipPath: 'polygon(0 66%, 100% 66%, 100% 100%, 0 100%)', transform: 'translateX(3px)' }}>
            ROAST<br /><span>ARENA</span>
          </div>
        </>
      )}
    </div>
  );
}

// ===== STAT COUNTER =====
function StatCounter({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-black text-arena-yellow neon-text-yellow">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[10px] md:text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const extractShortId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const createRoom = async () => {
    setLoading(true);
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from('rooms')
      .insert([{ room_code: roomCode, youtube_url: youtubeUrl || '' }]);

    if (error) {
      console.error("Room creation error:", error);
      alert("Failed to create room. Check database connection.");
      setLoading(false);
      return;
    }

    router.push(`/room/${roomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length > 0) {
      router.push(`/room/${joinCode.toUpperCase()}`);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-arena-black relative overflow-hidden">
      {/* Background effects */}
      <LandingParticles />
      <div className="fixed inset-0 bg-gradient-to-b from-arena-purple/5 via-transparent to-arena-red/5 pointer-events-none z-0" />
      <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-50" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-2"
        >
          <GlitchTitle />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-sm md:text-base text-white/40 font-bold tracking-[0.3em] uppercase mb-10"
        >
          SYNC &bull; ROAST &bull; DESTROY
        </motion.p>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full"
        >
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-2xl border border-white/5 mb-6">
            {(['create', 'join'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all',
                  activeTab === tab
                    ? 'bg-arena-yellow text-black shadow-neon-yellow'
                    : 'text-white/40 hover:text-white/60'
                )}
              >
                {tab === 'create' ? '⚔️ CREATE BATTLE' : '🎯 JOIN ROOM'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="glass rounded-3xl p-6 md:p-8 space-y-5"
              >
                {/* YouTube URL input (optional) */}
                <div>
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">
                    YouTube Shorts URL (optional)
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/shorts/..."
                    className="input-arena w-full text-sm"
                  />
                  {youtubeUrl && extractShortId(youtubeUrl) && (
                    <p className="text-arena-neon text-[10px] mt-2 font-bold">
                      ✅ Valid Short detected
                    </p>
                  )}
                </div>

                <button
                  onClick={createRoom}
                  disabled={loading}
                  className={cn(
                    'w-full py-5 rounded-2xl font-black text-xl md:text-2xl uppercase tracking-wider transition-all',
                    'bg-gradient-to-r from-arena-yellow to-arena-fire text-black',
                    'border-b-[6px] border-yellow-700 active:border-b-0 active:translate-y-[6px]',
                    'hover:shadow-neon-yellow hover:scale-[1.02]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      CREATING...
                    </span>
                  ) : (
                    '🔥 CREATE BATTLE'
                  )}
                </button>

                <p className="text-center text-[10px] text-white/20 font-medium">
                  A unique room code will be generated. Share it to invite your opponent.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleJoinRoom} className="glass rounded-3xl p-6 md:p-8 space-y-5">
                  <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">
                      Battle Code
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ENTER 6-DIGIT CODE"
                      maxLength={6}
                      className={cn(
                        'w-full bg-black/60 border-2 border-white/10 text-center text-arena-yellow',
                        'placeholder:text-yellow-900/40 p-5 rounded-2xl text-3xl font-mono font-black tracking-[0.5em]',
                        'focus:outline-none focus:border-arena-yellow focus:shadow-neon-yellow transition-all uppercase'
                      )}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joinCode.length === 0}
                    className={cn(
                      'w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all',
                      'bg-zinc-800 hover:bg-zinc-700 text-white',
                      'border-b-[6px] border-zinc-950 active:border-b-0 active:translate-y-[6px]',
                      'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                  >
                    ⚡ JOIN BATTLE
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 flex gap-8 md:gap-12"
        >
          <StatCounter label="Battles Today" value={1247} />
          <StatCounter label="Roasts Thrown" value={8921} />
          <StatCounter label="Careers Ended" value={342} />
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-8 text-[10px] text-white/10 font-bold uppercase tracking-widest"
        >
          Built for internet gladiators
        </motion.p>
      </div>
    </main>
  );
}