export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* Main Title Neon Effect ke sath */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-6 text-center">
        Reel Roast Battle 🔥
      </h1>
      
      {/* Tagline */}
      <p className="text-lg md:text-xl text-gray-400 mb-10 text-center max-w-lg">
        Watch YouTube Shorts in sync. Roast your friends. Let AI judge who has the highest internet IQ.
      </p>
      
      {/* Create Room Button */}
      <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform hover:-translate-y-1">
        Create Battle Room
      </button>

    </main>
  );
}