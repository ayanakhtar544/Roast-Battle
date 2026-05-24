'use client';

import { use, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import YouTube from 'react-youtube';
import { QRCodeSVG } from 'qrcode.react';

interface ChatMessage { sender: string; text: string; audioData?: string; videoId?: string; }
interface AIVerdict { winner: string; verdict: string; damageScore: string; }

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.id;

  const [myName, setMyName] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [status, setStatus] = useState('WAITING...');
  const [channel, setChannel] = useState<any>(null);

  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>({});
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const playerRef = useRef<any>(null);
  const isRemoteControl = useRef(false);

  const [isJudging, setIsJudging] = useState(false);
  const [verdict, setVerdict] = useState<AIVerdict | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const [showQR, setShowQR] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');

  const stateRef = useRef({ messages, playlist, currentIndex, isPlaying, scores });
  useEffect(() => {
    stateRef.current = { messages, playlist, currentIndex, isPlaying, scores };
  }, [messages, playlist, currentIndex, isPlaying, scores]);

  useEffect(() => {
    if (typeof window !== 'undefined') setRoomUrl(window.location.href);
    const generatedName = "ROASTER_" + Math.floor(Math.random() * 1000);
    setMyName(generatedName);

    const roomChannel = supabase.channel(`room_${roomCode}`);
    setChannel(roomChannel);

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = roomChannel.presenceState();
        const activeUsers: string[] = [];
        for (const id in presenceState) {
          // @ts-ignore
          activeUsers.push(presenceState[id][0].playerName);
        }
        setPlayers(activeUsers);
        setStatus(`LIVE 🔥 (${activeUsers.length})`);
      })
      .on('broadcast', { event: 'request_sync' }, () => {
        if (stateRef.current.messages.length > 0 || stateRef.current.playlist.length > 0) {
          roomChannel.send({ type: 'broadcast', event: 'sync_data', payload: stateRef.current });
        }
      })
      .on('broadcast', { event: 'sync_data' }, (payload) => {
        setMessages((prev) => prev.length === 0 ? payload.payload.messages : prev);
        setPlaylist((prev) => prev.length === 0 ? payload.payload.playlist : prev);
        setCurrentIndex(payload.payload.currentIndex);
        setIsPlaying(payload.payload.isPlaying);
        setScores((prev) => Object.keys(prev).length === 0 ? payload.payload.scores : prev);
      })
      .on('broadcast', { event: 'playlist_update' }, (payload) => {
        setPlaylist(payload.payload.playlist);
        setCurrentIndex(payload.payload.currentIndex);
        setIsPlaying(payload.payload.isPlaying);
        setVerdict(null); 
      })
      .on('broadcast', { event: 'video_action' }, (payload) => {
        if (!playerRef.current) return;
        const { action, time } = payload.payload;
        isRemoteControl.current = true;
        if (action === 'PLAY') { playerRef.current.seekTo(time, true); playerRef.current.playVideo(); } 
        else if (action === 'PAUSE') { playerRef.current.pauseVideo(); playerRef.current.seekTo(time, true); }
        setTimeout(() => { isRemoteControl.current = false; }, 500);
      })
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .on('broadcast', { event: 'ai_verdict' }, (payload) => {
        const data = payload.payload;
        setVerdict(data);
        
        // NAYA FIX: Naam ko saaf karke (Trim & Uppercase) match karwana
        if (data.winner) {
          const cleanWinner = data.winner.trim().toUpperCase();
          if (cleanWinner && cleanWinner !== "TIE" && cleanWinner !== "NONE") {
            setScores(prev => ({ ...prev, [cleanWinner]: (prev[cleanWinner] || 0) + 1 }));
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ playerName: generatedName });
          await roomChannel.send({ type: 'broadcast', event: 'request_sync', payload: {} });
        }
      });

    return () => { supabase.removeChannel(roomChannel); };
  }, [roomCode]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  const handleInvite = async () => { 
    if (navigator.share) {
      try { await navigator.share({ title: 'Join Roast Arena!', text: `Aaja bhai! Room Code: ${roomCode}`, url: roomUrl }); } 
      catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(roomUrl);
      alert("Link copied!");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const currentVidId = isPlaying ? playlist[currentIndex] : 'lobby';
          const newMsg: ChatMessage = { sender: myName, text: '🎤 Voice Roast', audioData: reader.result as string, videoId: currentVidId };
          setMessages((prev) => [...prev, newMsg]);
          if (channel) await channel.send({ type: 'broadcast', event: 'chat_message', payload: newMsg });
        };
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Mic permission allow kar de bhai!"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAddToQueue = async () => {
    if (videoUrlInput.includes('/shorts/')) {
      const id = videoUrlInput.split('/shorts/')[1].split('?')[0];
      const newPlaylist = [...playlist, id];
      setPlaylist(newPlaylist);
      if (channel) await channel.send({ type: 'broadcast', event: 'playlist_update', payload: { playlist: newPlaylist, currentIndex, isPlaying } });
      setVideoUrlInput('');
    } else alert("Sirf YouTube Shorts daal!");
  };

  const handleStartBattle = async () => {
    setIsPlaying(true);
    if (channel) await channel.send({ type: 'broadcast', event: 'playlist_update', payload: { playlist, currentIndex, isPlaying: true } });
  };

  const handleNextVideo = async () => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setVerdict(null); 
      if (channel) await channel.send({ type: 'broadcast', event: 'playlist_update', payload: { playlist, currentIndex: nextIndex, isPlaying } });
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !channel) return;
    
    const currentVidId = isPlaying ? playlist[currentIndex] : 'lobby';
    const newMsg: ChatMessage = { sender: myName, text: chatInput, videoId: currentVidId };
    
    setMessages((prev) => [...prev, newMsg]);
    await channel.send({ type: 'broadcast', event: 'chat_message', payload: newMsg });
    setChatInput('');
  };

  const callAIJudge = async () => {
    const currentVidId = playlist[currentIndex];
    const currentVideoChats = messages.filter(m => m.videoId === currentVidId);

    if (currentVideoChats.length < 2) return alert("Pehle is video par ek doosre ko roast toh karo!");
    
    setIsJudging(true);
    try {
      const res = await fetch('/api/judge', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages: currentVideoChats, videoId: currentVidId }) 
      });
      const data = await res.json();
      
      setVerdict(data);
      
      // NAYA FIX: Naam ko saaf karke yahan bhi update karna hai
      if (data.winner) {
        const cleanWinner = data.winner.trim().toUpperCase();
        if (cleanWinner && cleanWinner !== "TIE" && cleanWinner !== "NONE") {
          setScores(prev => ({ ...prev, [cleanWinner]: (prev[cleanWinner] || 0) + 1 }));
        }
      }

      if (channel) await channel.send({ type: 'broadcast', event: 'ai_verdict', payload: data });
    } catch (error) { alert("AI so raha hai."); } finally { setIsJudging(false); }
  };

  const onReady = (event: any) => { playerRef.current = event.target; };
  const onPlay = async (event: any) => { if (!isRemoteControl.current && channel) await channel.send({ type: 'broadcast', event: 'video_action', payload: { action: 'PLAY', time: event.target.getCurrentTime() } }); };
  const onPause = async (event: any) => { if (!isRemoteControl.current && channel) await channel.send({ type: 'broadcast', event: 'video_action', payload: { action: 'PAUSE', time: event.target.getCurrentTime() } }); };

  const playerOptions = { height: '100%', width: '100%', playerVars: { autoplay: 0, controls: 1 } };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#050505] p-2 md:p-4 overflow-hidden font-sans relative selection:bg-yellow-400 selection:text-black">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#facc1511_1px,transparent_1px),linear-gradient(to_bottom,#facc1511_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {showQR && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border-4 border-yellow-400 p-8 rounded-3xl shadow-[0_0_80px_rgba(250,204,21,0.5)] flex flex-col items-center">
            <h2 className="text-yellow-400 font-black text-3xl mb-6 uppercase">SCAN TO JOIN</h2>
            <div className="bg-white p-4 rounded-xl"><QRCodeSVG value={roomUrl} size={240} level="H" includeMargin={false} /></div>
            <p className="mt-8 text-yellow-100 font-mono text-2xl font-black bg-yellow-900/40 px-8 py-3 rounded-xl border-2 border-yellow-500/50">{roomCode}</p>
          </div>
          <button onClick={() => setShowQR(false)} className="mt-10 px-10 py-4 bg-red-500 text-black font-black uppercase rounded-xl border-2 border-red-800 shadow-[0_6px_0_0_#7f1d1d] active:translate-y-[6px] active:shadow-none transition-all">CLOSE</button>
        </div>
      )}

      {verdict && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border-4 border-yellow-400 rounded-[2rem] p-6 max-w-lg w-full text-center shadow-[0_0_100px_rgba(250,204,21,0.4)]">
            <h2 className="text-4xl font-black text-yellow-400 mb-2 uppercase">🔥 ROUND OVER 🔥</h2>
            <div className="my-6 py-6 border-y-2 border-yellow-900/50">
              <p className="text-yellow-600 uppercase text-sm font-black mb-2">Winner (+1 Score)</p>
              <p className="text-4xl font-black text-white">{verdict.winner}</p>
            </div>
            <p className="text-xl text-yellow-100 italic mb-8 font-bold">"{verdict.verdict}"</p>
            <button onClick={() => { setVerdict(null); handleNextVideo(); }} className="w-full py-5 bg-yellow-400 text-black text-xl font-black uppercase rounded-xl border-2 border-yellow-700 shadow-[0_6px_0_0_#a16207] active:translate-y-[6px] active:shadow-none">PLAY NEXT ROUND</button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* HEADER */}
        <div className="shrink-0 flex justify-between items-center bg-white/[0.03] backdrop-blur-md p-3 md:p-4 mb-3 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white flex items-center gap-3 uppercase drop-shadow-md">
              ROOM <span className="text-yellow-400 px-4 py-1.5 bg-black/50 rounded-xl border-2 border-yellow-500/30">{roomCode}</span>
            </h1>
            <button onClick={() => setShowQR(true)} className="px-4 py-2 bg-zinc-800 text-yellow-400 font-bold rounded-xl border-2 border-zinc-950 shadow-[0_4px_0_0_#09090b] active:translate-y-[4px] active:shadow-none">QR 📱</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/10">
              <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="font-black text-xs text-yellow-400">{status}</span>
            </div>
            <button onClick={callAIJudge} disabled={isJudging || !isPlaying} className="px-6 py-2.5 bg-red-500 text-black font-black rounded-xl border-2 border-red-800 shadow-[0_6px_0_0_#7f1d1d] active:translate-y-[6px] active:shadow-none disabled:bg-zinc-800 disabled:shadow-none transition-all">
              {isJudging ? "JUDGING..." : "JUDGE ⚖️"}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-3 md:gap-4 overflow-hidden">
          
          {/* LEFT: Video Player */}
          <div className="h-[45%] lg:h-full lg:w-1/2 flex flex-col bg-white/[0.02] backdrop-blur-sm p-3 md:p-4 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            {!isPlaying ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-black/40 rounded-2xl border-2 border-dashed border-yellow-500/30 p-6 text-center overflow-y-auto">
                <h3 className="text-xl font-black text-yellow-400 mb-6 uppercase">Setup Queue</h3>
                <div className="flex w-full gap-3 mb-6">
                  <input type="text" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="PASTE SHORT LINK..." className="flex-1 bg-black/60 text-yellow-400 p-4 rounded-xl font-mono focus:border-yellow-400" />
                  <button onClick={handleAddToQueue} className="px-5 py-3 bg-zinc-800 text-yellow-400 font-black rounded-xl border-2 border-zinc-950 shadow-[0_5px_0_0_#09090b] active:translate-y-[5px] active:shadow-none">ADD ➕</button>
                </div>
                {playlist.length > 0 ? (
                  <button onClick={handleStartBattle} className="mt-auto px-8 py-5 bg-yellow-400 text-black font-black rounded-2xl w-full border-2 border-yellow-700 shadow-[0_6px_0_0_#a16207] active:translate-y-[6px] active:shadow-none">START BATTLE 🔥</button>
                ) : null}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="shrink-0 flex justify-between items-center mb-3 px-2">
                  <h3 className="text-yellow-400 font-black uppercase bg-black/50 px-4 py-2 rounded-xl border border-yellow-500/20">Round {currentIndex + 1} / {playlist.length}</h3>
                  {currentIndex < playlist.length - 1 && (
                    <button onClick={handleNextVideo} className="px-5 py-2 bg-zinc-800 text-yellow-400 font-black rounded-xl border-2 border-zinc-950 shadow-[0_4px_0_0_#09090b] active:translate-y-[4px] active:shadow-none">NEXT ⏭️</button>
                  )}
                </div>
                <div className="flex-1 bg-black rounded-2xl overflow-hidden border-2 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex justify-center items-center">
                  <YouTube key={playlist[currentIndex]} videoId={playlist[currentIndex]} opts={playerOptions} onReady={onReady} onPlay={onPlay} onPause={onPause} className="absolute inset-0 w-full h-full flex justify-center" iframeClassName="w-full h-full max-w-[450px] object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Chat Room */}
          <div className="h-[55%] lg:h-full lg:w-1/2 flex flex-col bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="shrink-0 bg-black/40 border-b border-white/10 p-3 text-center flex flex-col px-5 items-center">
               <div className="flex justify-between w-full items-center mb-2">
                 <h3 className="font-black text-white uppercase tracking-widest">Roast Chat 💬</h3>
               </div>
               <div className="w-full flex gap-2 overflow-x-auto no-scrollbar py-1">
                 <span className="text-[10px] text-yellow-600 font-black uppercase flex items-center">Scoreboard:</span>
                 {players.map((p, i) => {
                   const cleanP = p.trim().toUpperCase(); // NAYA: Score dikhate waqt bhi clean string use karo
                   return (
                     <span key={i} className={`px-2 py-1 text-[10px] font-black rounded-md border ${p === myName ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-zinc-800 text-zinc-300 border-zinc-600'} whitespace-nowrap`}>
                       {p} {p === myName ? '(YOU)' : ''} 🏆 {scores[cleanP] || 0}
                     </span>
                   );
                 })}
               </div>
            </div>
            
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-black/20 to-black/60">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === myName;
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-zinc-400 mb-1.5 px-2 font-bold uppercase bg-black/40 rounded-md py-0.5">{isMe ? 'You' : msg.sender}</span>
                    <div className={`px-5 py-3 max-w-[85%] font-bold rounded-2xl border-b-4 ${isMe ? 'bg-yellow-400 text-black rounded-br-none border-yellow-600' : 'bg-zinc-800 text-white rounded-bl-none border-zinc-950'}`}>
                      {msg.text}
                      {msg.audioData && <audio controls src={msg.audioData} className="mt-3 h-10 w-56 opacity-95 rounded-lg" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendChatMessage} className="shrink-0 p-4 bg-black/60 border-t border-white/10 flex gap-3 items-center">
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-4 rounded-xl border-2 ${isRecording ? 'bg-red-500 border-red-800 text-black shadow-[0_4px_0_0_#7f1d1d] active:translate-y-[4px] animate-pulse' : 'bg-zinc-800 border-zinc-950 text-yellow-400 shadow-[0_4px_0_0_#09090b] active:translate-y-[4px] active:shadow-none'}`}>
                {isRecording ? '⏹️' : '🎤'}
              </button>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={isRecording ? "RECORDING..." : "TYPE ROAST..."} disabled={isRecording} className="flex-1 bg-black/80 border-2 border-white/10 rounded-xl px-5 py-4 text-white font-mono focus:border-yellow-400 uppercase" />
              <button type="submit" disabled={!chatInput.trim() || isRecording} className="bg-yellow-400 text-black px-6 py-4 rounded-xl font-black uppercase border-2 border-yellow-700 shadow-[0_5px_0_0_#a16207] active:translate-y-[5px] active:shadow-none disabled:bg-zinc-800 disabled:shadow-[0_5px_0_0_#09090b] transition-all">
                SEND
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}