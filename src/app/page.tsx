'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const createRoom = async () => {
    setLoading(true);
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from('rooms')
      .insert([{ room_code: roomCode, youtube_url: '' }]);

    if (error) {
      console.error("Room banane me error:", error);
      alert("Bhai room nahi ban paya, database connection check kar.");
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#09090b] font-sans selection:bg-yellow-400 selection:text-black">
      
      {/* 1. NAYA UI: Logo / Title Area with Yellow Glow */}
      <div className="relative mb-10 text-center">
        <div className="absolute -inset-4 bg-yellow-400 blur-[80px] opacity-10 rounded-full pointer-events-none"></div>
        <h1 className="relative text-6xl md:text-8xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
          Roast
          <span className="text-yellow-400 ml-2">Arena</span>
        </h1>
        <p className="mt-3 text-lg md:text-xl text-yellow-100/60 font-bold tracking-wide uppercase">
          Sync. Roast. Dominate. 🎤
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-sm relative z-10">
        
        {/* 2. NAYA UI: 3D Yellow Create Button */}
        {/* Trick: Niche border moti rakhi hai (border-b-[6px]), aur dabane par border 0 karke button ko neeche push kar rahe hain (active:translate-y) */}
        <button 
          onClick={createRoom}
          disabled={loading}
          className="w-full px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-2xl uppercase tracking-wider rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
          border-b-[6px] border-yellow-600 active:border-b-0 active:translate-y-[6px]"
        >
          {loading ? "CREATING..." : "CREATE BATTLE"}
        </button>

        {/* Divider */}
        <div className="flex items-center w-full gap-4 opacity-60 my-2">
          <div className="flex-1 h-px bg-yellow-900/50"></div>
          <span className="text-yellow-600 font-bold text-sm tracking-widest uppercase">Or Enter Code</span>
          <div className="flex-1 h-px bg-yellow-900/50"></div>
        </div>

        {/* Join Room Section */}
        <form onSubmit={handleJoinRoom} className="w-full flex flex-col gap-4">
          <div className="relative">
            {/* Input Box me Yellow Theme */}
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER 6-DIGIT CODE"
              maxLength={6}
              className="w-full bg-[#121214] border-2 border-yellow-900/30 text-center text-yellow-400 placeholder:text-yellow-900/50 p-4 rounded-2xl text-2xl font-mono font-black tracking-widest focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all uppercase"
            />
          </div>
          
          {/* 3. NAYA UI: Secondary 3D Button (Dark Grey Theme) */}
          <button 
            type="submit"
            disabled={joinCode.length === 0}
            className="w-full px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xl uppercase tracking-wider rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
            border-b-[6px] border-zinc-950 active:border-b-0 active:translate-y-[6px]"
          >
            JOIN ROOM
          </button>
        </form>

      </div>
    </main>
  );
}