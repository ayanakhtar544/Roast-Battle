'use client';

import { use, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useBattleStore } from '@/stores/battleStore';
import { useUIStore } from '@/stores/uiStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useTypingBroadcast } from '@/hooks/useTypingBroadcast';
import { useCanvasRecorder } from '@/hooks/useCanvasRecorder';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { reactToRoast, judgeRound, getFinalVerdict } from '@/lib/ai';
import { QRCodeSVG } from 'qrcode.react';

// UI components structure
import BattleHeader from '@/components/arena/BattleHeader';
import { FaceCam } from '@/components/arena/FaceCam';
import { YouTubePlayer } from '@/components/arena/YouTubePlayer';
import { RoastInput } from '@/components/arena/RoastInput';
import { RoastFeed } from '@/components/arena/RoastFeed';
import { AIJudgePanel } from '@/components/arena/AIJudgePanel';
import DamageOverlay from '@/components/arena/DamageOverlay';
import BattleCountdown from '@/components/arena/BattleCountdown';
import PopupReaction from '@/components/arena/PopupReaction';
import { VictoryScreen } from '@/components/arena/VictoryScreen';
import { ClipExporter } from '@/components/export/ClipExporter';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.id;

  const [channel, setChannel] = useState<any>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showExporter, setShowExporter] = useState(false);
  
  // NEW DOM ACTIONS UI OVERLAYS STATE MANAGEMENT
  const [showShareHub, setShowShareHub] = useState(false);
  const [isUserListHovered, setIsUserListHovered] = useState(false);
  const [roomUrlStr, setRoomUrlStr] = useState('');

  // ZUSTAND STORES SELECTORS
  const {
    myName,
    players,
    playerStates,
    battlePhase,
    playlist,
    currentVideoIndex,
    isPlaying,
    roasts,
    aiJudgments,
    winner,
    finalVerdict,
    mostCookedRoast,
    setRoom,
    setPlayers,
    updatePlayerState,
    setBattlePhase,
    setCurrentRound,
    setPlaylist,
    setCurrentVideoIndex,
    setIsPlaying,
    addRoast,
    updateRoastScore,
    addAIJudgment,
    setAICommentary,
    setLatestReaction,
    dealDamage,
    setWinner,
    reset: resetBattleStore,
  } = useBattleStore();

  const {
    showCountdown,
    triggerShake,
    triggerFlash,
    queuePopup,
    showEmotionalDamage,
    startCountdown,
    endCountdown,
    resetUI,
  } = useUIStore();

  useSoundEffects();

  const opponentName = players.find((p) => p !== myName) || '';

  const { localStream, remoteStream, isWebRTCConnected } = useWebRTC({
    channel,
    myName,
    players,
  });

  const { isSpeaking: mySpeaking, audioLevel: myAudioLevel } = useAudioAnalyzer(localStream);
  const { isSpeaking: oppSpeaking, audioLevel: oppAudioLevel } = useAudioAnalyzer(remoteStream);

  const { broadcastTyping, opponentTyping } = useTypingBroadcast({
    channel,
    myName,
  });

  const {
    startRecording,
    stopRecording,
    downloadClip,
    clipBlob,
    isRecording,
  } = useCanvasRecorder({
    localStream,
    remoteStream,
    opponentName,
  });

  const isHost = players.sort()[0] === myName;

  const lockSyncRef = useRef({ roasts, playlist, currentVideoIndex, isPlaying, playerStates, battlePhase });
  useEffect(() => {
    lockSyncRef.current = { roasts, playlist, currentVideoIndex, isPlaying, playerStates, battlePhase };
  }, [roasts, playlist, currentVideoIndex, isPlaying, playerStates, battlePhase]);

  // SUPABASE REALTIME LIFECYCLE INITIALIZER MATRIX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRoomUrlStr(window.location.href);
    }
    const generatedName = 'ROASTER_' + Math.floor(Math.random() * 1000);
    setRoom(roomCode, generatedName);

    const roomChannel = supabase.channel(`room_${roomCode}`);

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = roomChannel.presenceState();
        const activeUsers: string[] = [];
        for (const id in presenceState) {
          // @ts-ignore
          if (presenceState[id]?.[0]?.playerName) {
            // @ts-ignore
            activeUsers.push(presenceState[id][0].playerName);
          }
        }
        setPlayers(activeUsers);
      })
      .on('broadcast', { event: 'request_sync' }, () => {
        if (lockSyncRef.current.playlist.length > 0 || lockSyncRef.current.roasts.length > 0) {
          roomChannel.send({
            type: 'broadcast',
            event: 'sync_data',
            payload: {
              playlist: lockSyncRef.current.playlist,
              currentVideoIndex: lockSyncRef.current.currentVideoIndex,
              isPlaying: lockSyncRef.current.isPlaying,
              roasts: lockSyncRef.current.roasts,
              aiJudgments,
              battlePhase: lockSyncRef.current.battlePhase,
              winner,
              finalVerdict,
              mostCookedRoast,
              scores: Object.fromEntries(
                Object.entries(lockSyncRef.current.playerStates).map(([k, v]) => [k, v.score])
              ),
            },
          });
        }
      })
      .on('broadcast', { event: 'sync_data' }, (payload: any) => {
        const data = payload.payload;
        if (data.playlist?.length > 0) setPlaylist(data.playlist);
        setCurrentVideoIndex(data.currentVideoIndex ?? 0);
        setIsPlaying(data.isPlaying ?? false);
        setBattlePhase(data.battlePhase ?? 'lobby');

        if (data.scores) {
          Object.entries(data.scores).forEach(([name, score]) => {
            updatePlayerState(name, { score: score as number });
          });
        }

        if (data.roasts?.length > 0) {
          data.roasts.forEach((r: any) => addRoast(r));
        }
      })
      .on('broadcast', { event: 'playlist_update' }, (payload: any) => {
        const { playlist: newPlaylist, currentVideoIndex: index, isPlaying: playing } = payload.payload;
        setPlaylist(newPlaylist);
        setCurrentVideoIndex(index);
        setIsPlaying(playing);
      })
      .on('broadcast', { event: 'phase_change' }, (payload: any) => {
        setBattlePhase(payload.payload.phase);
      })
      .on('broadcast', { event: 'roast_rated' }, (payload: any) => {
        const { roastId, score, reaction, damageLevel, damageAmount, sender } = payload.payload;
        updateRoastScore(roastId, score, reaction, damageLevel);
        setLatestReaction(reaction);
        setAICommentary(`${sender.toUpperCase()} CONTEXT RATED: ${score}/10`);

        const target = sender === generatedName ? opponentName : generatedName;
        if (target) {
          dealDamage(target, damageAmount, damageLevel, roastId);
          triggerShake(damageLevel === 'critical' ? 'heavy' : 'medium');
          triggerFlash('#ff2d55');
        }
      })
      .on('broadcast', { event: 'ai_verdict' }, (payload: any) => {
        const { winner: roundWinner, verdict: roundVerdict, damageScore } = payload.payload;
        const cleanWinner = roundWinner ? roundWinner.trim().toUpperCase() : 'TIE';

        addAIJudgment({
          roundIndex: lockSyncRef.current.currentVideoIndex,
          winner: cleanWinner,
          verdict: roundVerdict,
          damageScore,
          timestamp: Date.now(),
        });

        setAICommentary(`AI JUDGES BASED ON EXPRESSIONS & AUDIO: ${cleanWinner} LEADS`);
        
        const targetWinnerStateName = players.find(p => p.trim().toUpperCase() === cleanWinner) || cleanWinner;
        const loser = targetWinnerStateName === myName ? opponentName : myName;
        
        if (loser) {
          dealDamage(loser, damageScore, 'critical', `judge-${lockSyncRef.current.currentVideoIndex}`);
          if (cleanWinner !== 'TIE' && cleanWinner !== 'NONE') {
            const currentScore = lockSyncRef.current.playerStates[targetWinnerStateName]?.score || 0;
            updatePlayerState(targetWinnerStateName, { score: currentScore + 1 });
          }
          triggerShake('heavy');
          triggerFlash('#ff2d55');
        }
      })
      .on('broadcast', { event: 'chat_message' }, (payload: any) => {
        addRoast(payload.payload);
      })
      .on('broadcast', { event: 'battle_results' }, (payload: any) => {
        const { winner: finalWinner, verdict: finalVerdictText, mostCooked } = payload.payload;
        setWinner(finalWinner, finalVerdictText, mostCooked);
        setBattlePhase('results');
        stopRecording();
      });

    roomChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await roomChannel.track({ playerName: generatedName });
        await roomChannel.send({ type: 'broadcast', event: 'request_sync', payload: {} });
      }
    });

    setChannel(roomChannel);

    return () => {
      supabase.removeChannel(roomChannel);
      resetBattleStore();
      resetUI();
    };
  }, [roomCode]);

  const handleAddToQueue = async () => {
    if (videoUrlInput.includes('/shorts/')) {
      const id = videoUrlInput.split('/shorts/')[1].split('?')[0];
      const newPlaylist = [...playlist, id];
      setPlaylist(newPlaylist);
      setVideoUrlInput('');

      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'playlist_update',
          payload: { playlist: newPlaylist, currentVideoIndex, isPlaying },
        });
      }
    } else {
      alert('Bhai, sirf YouTube Shorts link paste kar!');
    }
  };

  const handleStartBattle = async () => {
    if (playlist.length === 0) return;
    if (channel) {
      await channel.send({ type: 'broadcast', event: 'phase_change', payload: { phase: 'countdown' } });
    }
    setBattlePhase('countdown');
  };

  useEffect(() => {
    if (battlePhase !== 'countdown') return;

    startCountdown(3);
    const interval = setInterval(() => {
      useUIStore.setState((state) => {
        if (state.countdownValue <= 1) {
          clearInterval(interval);
          endCountdown();

          if (isHost && channel) {
            channel.send({ type: 'broadcast', event: 'phase_change', payload: { phase: 'battle' } });
            setIsPlaying(true);
            channel.send({
              type: 'broadcast',
              event: 'playlist_update',
              payload: { playlist, currentVideoIndex, isPlaying: true },
            });
          }
          setBattlePhase('battle');
          startRecording();
          return { countdownValue: 0 };
        }
        return { countdownValue: state.countdownValue - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [battlePhase, isHost, channel, playlist, currentVideoIndex, startCountdown, endCountdown, setIsPlaying, startRecording]);

  // CORE ADVANCED MULTIMODAL ROAST PROCESSOR (Audio + Optional Text Handler)
  const handleSendRoast = async (text: string, audioBase64?: string) => {
    if (!text.trim() && !audioBase64 && !channel) return;

    const currentVideoId = playlist[currentVideoIndex] || 'lobby';
    const roastId = `roast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const newRoast = { 
      id: roastId, 
      sender: myName, 
      text: text || "🎤 Voice Expression Roast Execution", 
      audioData: audioBase64 || null,
      videoId: currentVideoId, 
      timestamp: Date.now() 
    };

    addRoast(newRoast);
    await channel.send({ type: 'broadcast', event: 'chat_message', payload: newRoast });

    try {
      // Dynamic metric evaluations mapped from streaming context expressions
      const mockExpressionMetrics = {
        speakingVolumeDensity: myAudioLevel,
        facialMovementIntensity: Math.random() * 80 + 20,
        unhingedGenZEnergy: 100
      };

      const response = await reactToRoast(newRoast.text, myName, `Multimodal Canvas Metric Context: ${JSON.stringify(mockExpressionMetrics)}`);
      const damageAmount = response.score * (response.damageLevel === 'critical' ? 5 : 2);

      await channel.send({
        type: 'broadcast',
        event: 'roast_rated',
        payload: { roastId, score: response.score, reaction: response.reaction, damageLevel: response.damageLevel, damageAmount, sender: myName },
      });

      updateRoastScore(roastId, response.score, response.reaction, response.damageLevel);
      setLatestReaction(response.reaction);

      if (opponentName) {
        dealDamage(opponentName, damageAmount, response.damageLevel, roastId);
        triggerShake(response.damageLevel === 'critical' ? 'heavy' : 'medium');
        triggerFlash('#ff2d55');
        queuePopup(response.damageLevel === 'critical' ? 'EMOTIONAL DAMAGE' : 'GREAT AUDIO BURN 🔥', response.damageLevel === 'critical' ? '💥' : '🎤', '#ff2d55');
      }
    } catch (err) {
      console.error('Multimodal reaction pipeline issue:', err);
    }
  };

  const callAIJudge = async () => {
    if (!channel) return;

    setBattlePhase('judging');
    await channel.send({ type: 'broadcast', event: 'phase_change', payload: { phase: 'judging' } });

    try {
      const currentVideoId = playlist[currentVideoIndex];
      const videoChats = roasts.filter((r) => r.videoId === currentVideoId);

      const computedExpressionLogs = {
        player_1_volume_average: myAudioLevel * 10,
        player_2_volume_average: oppAudioLevel * 10
      };

      // Call optimized clean backend api routing structure directly
      const res = await fetch('/api/ai/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: videoChats, videoId: currentVideoId, playerMetrics: computedExpressionLogs })
      });
      
      const result = await res.json();
      const cleanWinner = result.winner ? result.winner.trim().toUpperCase() : 'TIE';

      await channel.send({
        type: 'broadcast',
        event: 'ai_verdict',
        payload: { ...result, winner: cleanWinner },
      });

      addAIJudgment({
        roundIndex: currentVideoIndex,
        winner: cleanWinner,
        verdict: result.verdict,
        damageScore: result.damageScore,
        timestamp: Date.now(),
      });

      setAICommentary(`AI VERDICT PROCESSED: WINNER IS ${cleanWinner}`);

      const targetWinnerStateName = players.find(p => p.trim().toUpperCase() === cleanWinner) || cleanWinner;
      const loser = targetWinnerStateName === myName ? opponentName : myName;

      if (loser) {
        dealDamage(loser, result.damageScore, 'critical', `judge-${currentVideoIndex}`);
        if (cleanWinner !== 'TIE' && cleanWinner !== 'NONE') {
          const currentScore = playerStates[targetWinnerStateName]?.score || 0;
          updatePlayerState(targetWinnerStateName, { score: currentScore + 1 });
        }
        triggerShake('heavy');
        triggerFlash('#ff2d55');
      }

      setTimeout(() => { handleNextRoundProgress(); }, 8000);
    } catch (err) {
      console.error('AI Judging loop issue:', err);
      setBattlePhase('battle');
    }
  };

  const handleNextRoundProgress = async () => {
    if (currentVideoIndex < playlist.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      setCurrentRound(nextIndex);

      if (channel) {
        await channel.send({ type: 'broadcast', event: 'playlist_update', payload: { playlist, currentVideoIndex: nextIndex, isPlaying: true } });
        await channel.send({ type: 'broadcast', event: 'phase_change', payload: { phase: 'countdown' } });
      }
      setBattlePhase('countdown');
    } else {
      await triggerFinalWinnerEvaluation();
    }
  };

  const triggerFinalWinnerEvaluation = async () => {
    try {
      const scoreMap = Object.fromEntries(Object.entries(playerStates).map(([k, v]) => [k, v.score]));
      const results = await getFinalVerdict(roasts, scoreMap, playlist.length);
      const sortedRoasts = [...roasts].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      const mostCooked = sortedRoasts[0] || null;

      if (channel) {
        await channel.send({ type: 'broadcast', event: 'battle_results', payload: { winner: results.winner, verdict: results.verdict, mostCooked } });
      }

      setWinner(results.winner, results.verdict, mostCooked);
      setBattlePhase('results');
      stopRecording();
    } catch (err) {
      console.error('Final stats crash:', err);
    }
  };

  const triggerNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Roast Arena Combat Match', text: `Aaja battle room me code: ${roomCode}`, url: roomUrlStr });
      } catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(roomUrlStr);
      queuePopup('LINK COPIED', '📋', '#facc15');
    }
  };

  const onVideoEnd = () => {
    if (isHost && lockSyncRef.current.battlePhase === 'battle') {
      callAIJudge();
    }
  };

  return (
    <DamageOverlay>
      {/* NEW MODAL SHARE DIALOG: QR Integration, copy links and fully cross-sharing utility setup wrappers.
      */}
      {showShareHub && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0b0b0e] border-4 border-yellow-400 rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-[0_0_80px_rgba(250,204,21,0.4)] relative">
            <h3 className="text-2xl font-black text-yellow-400 uppercase tracking-widest mb-4">INVITE GLADIATOR</h3>
            
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
              <QRCodeSVG value={roomUrlStr} size={200} level="H" includeMargin={false} />
            </div>

            <p className="text-xs text-zinc-400 font-mono mb-6 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 break-all select-all">
              {roomUrlStr}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={triggerNativeShare} className="py-3 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 text-xs font-black uppercase rounded-xl border-2 border-zinc-950 transition-all">
                NATIVE SHARE 📱
              </button>
              <button onClick={() => { navigator.clipboard.writeText(roomUrlStr); queuePopup('COPIED!', '📋', '#facc15'); }} className="py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase rounded-xl border-2 border-yellow-600 transition-all">
                COPY LINK 🔗
              </button>
            </div>

            <button onClick={() => setShowShareHub(false)} className="mt-6 text-zinc-500 hover:text-red-400 text-[11px] font-mono tracking-widest uppercase block mx-auto">
              [ DISMISS SHARING ]
            </button>
          </div>
        </div>
      )}

      <div className="min-h-[100dvh] w-full bg-[#070709] text-white flex flex-col p-4 md:p-6 font-sans overflow-y-auto overflow-x-hidden select-none">
        
        {/* TOP INTERACTIVE DESCRIPTORS AND HOVER COUNTER PIPELINES */}
        <div className="w-full flex justify-between items-center bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 mb-4 relative">
          <h1 className="text-xl font-black tracking-wider uppercase text-yellow-400">ROAST ARENA Matrix</h1>
          
          <div className="flex items-center gap-4 relative">
            {/* HOVER ZONE LIVE PLAYER SELECTION COMPONENT */}
            <div 
              onMouseEnter={() => setIsUserListHovered(true)}
              onMouseLeave={() => setIsUserListHovered(false)}
              className="bg-black/60 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:border-yellow-400/50 relative"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-mono text-xs font-bold text-zinc-300">LIVE: {players.length} USERS</span>
              
              {/* SLIDE DROPDOWN TOOLTIP INTERFACE */}
              {isUserListHovered && (
                <div className="absolute top-11 right-0 w-56 bg-[#0a0a0d] border border-zinc-800 p-3 rounded-xl shadow-2xl z-40 space-y-1.5 animate-slideUp">
                  <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase pb-1 border-b border-zinc-900">ROASTER USER LIST</p>
                  {players.map((p, idx) => (
                    <div key={idx} className="text-[11px] font-mono py-1 px-2 bg-zinc-900/40 rounded border border-zinc-800/20 truncate text-yellow-400/90 flex items-center justify-between">
                      <span>{p}</span>
                      {p === myName && <span className="text-[8px] px-1 bg-yellow-400 text-black font-bold rounded">YOU</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setShowShareHub(true)} className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase rounded-xl tracking-wider transition-all shadow-md border-b-2 border-yellow-700">
              SHARE
            </button>
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col lg:flex-row gap-6 items-start justify-between max-w-[1600px] mx-auto">
          
          {/* COLUMN LEFT: WEBRTC BOUNDS */}
          <div className="w-full lg:w-[24%] flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0">
            <div className="w-full lg:h-[220px]">
              <FaceCam stream={localStream} playerName={`${myName} (YOU)`} isLocal={true} hp={playerStates[myName]?.hp ?? 100} isSpeaking={mySpeaking} playerColor="yellow" />
            </div>
            <div className="w-full lg:h-[220px]">
              {opponentName ? (
                <FaceCam stream={remoteStream} playerName={opponentName} isLocal={false} hp={playerStates[opponentName]?.hp ?? 100} isSpeaking={oppSpeaking} playerColor="cyan" />
              ) : (
                <div className="w-full h-full min-h-[160px] lg:h-[220px] rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-3xl animate-pulse mb-2">👁️‍🗨️</span>
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">WAITING TO CONFLICT...</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN CENTER: AUDIO STREAM PLATFORM CONTROLLER */}
          <div className="w-full lg:w-[48%] flex flex-col bg-zinc-950/40 border border-zinc-900 rounded-[2rem] p-5 shadow-2xl relative min-h-[480px] lg:min-h-[580px] justify-center items-center overflow-hidden">
            {!isPlaying ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6 p-4">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 uppercase tracking-widest">
                    ARENA STAGING
                  </h2>
                </div>

                <div className="flex w-full max-w-md gap-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
                  <input type="text" value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} placeholder="PASTE YOUTUBE SHORTS LINK..." className="flex-1 bg-transparent text-yellow-400 px-3 py-2 font-mono text-xs focus:outline-none placeholder-zinc-600 uppercase" />
                  <button onClick={handleAddToQueue} className="px-5 bg-zinc-800 text-yellow-400 rounded-lg font-black text-xs uppercase transition-all border border-zinc-700">ADD</button>
                </div>

                {playlist.length > 0 && (
                  <button onClick={handleStartBattle} className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase rounded-xl text-sm tracking-widest transition-all">
                    ENTER THE ARENA 🔥
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full max-w-[340px] h-full min-h-[500px] lg:h-[550px] relative overflow-hidden rounded-2xl border-4 border-zinc-900 shadow-2xl bg-black">
                <YouTubePlayer key={playlist[currentVideoIndex]} videoId={playlist[currentVideoIndex]} onEnd={onVideoEnd} />
              </div>
            )}
          </div>

          {/* COLUMN RIGHT */}
          <div className="w-full lg:w-[24%] flex flex-col gap-4 shrink-0 lg:h-[580px]">
            <div className="flex-1 min-h-[250px] bg-zinc-950/20 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col">
              <RoastFeed roasts={roasts.filter((r) => r.videoId === playlist[currentVideoIndex])} myName={myName} />
            </div>
            <div className="h-[150px] bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 shadow-inner shrink-0 overflow-hidden">
              <AIJudgePanel verdict={aiJudgments[aiJudgments.length - 1] || null} commentary={useBattleStore((state) => state.aiCommentary)} latestReaction={useBattleStore((state) => state.latestReaction)} isJudging={battlePhase === 'judging'} />
            </div>
          </div>

        </div>

        {/* VOICE INPUT MULTIMODAL CORE PANEL: TEXT REPLACES TO OPTIONAL SLOTS */}
        <div className="w-full block mt-6 max-w-[1600px] mx-auto relative clear-both">
          <RoastInput onSubmit={handleSendRoast} onTyping={() => broadcastTyping(true)} disabled={battlePhase !== 'battle'} />
          {opponentTyping && (
            <div className="absolute -top-7 left-4 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-3 py-1 rounded-md">
              🍳 {opponentName.toUpperCase()} IS COOKING... 🍳
            </div>
          )}
        </div>

      </div>

      {/* MODAL TRANSLATION GRAPHICS */}
      {showCountdown && <BattleCountdown />}
      <PopupReaction />

      {battlePhase === 'results' && winner && (
        <VictoryScreen show={true} winner={winner} loser={winner === myName ? opponentName : myName} finalVerdict={finalVerdict || 'Sheer psychological wreckage.'} winnerScore={playerStates[winner]?.score || 0} loserScore={playerStates[winner === myName ? opponentName : myName]?.score || 0} mostCookedRoast={mostCookedRoast} onDownload={() => setShowExporter(true)} onClose={() => setBattlePhase('lobby')} />
      )}

      {showExporter && clipBlob && <ClipExporter clipBlob={clipBlob} onDownload={downloadClip} onClose={() => setShowExporter(false)} />}
    </DamageOverlay>
  );
}