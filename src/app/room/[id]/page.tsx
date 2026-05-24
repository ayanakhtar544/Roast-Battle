'use client';

import { use, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useBattleStore } from '@/stores/battleStore';
import { useUIStore } from '@/stores/uiStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useTypingBroadcast } from '@/hooks/useTypingBroadcast';
import { useCanvasRecorder } from '@/hooks/useCanvasRecorder';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { reactToRoast, judgeRound, getFinalVerdict } from '@/lib/ai';

// UI and layout imports
import BattleLayout from '@/components/arena/BattleLayout';
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

  // ZUSTAND STORES
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
    countdownValue,
    triggerShake,
    triggerFlash,
    triggerGlitch,
    queuePopup,
    showEmotionalDamage,
    startCountdown,
    setCountdownValue,
    endCountdown,
    resetUI,
  } = useUIStore();

  // 1. SOUND EFFECTS SYNTHESIZER INTEGRATION
  useSoundEffects();

  // Setup room channel and generate name
  useEffect(() => {
    const generatedName = 'ROASTER_' + Math.floor(Math.random() * 1000);
    setRoom(roomCode, generatedName);

    const roomChannel = supabase.channel(`room_${roomCode}`);
    setChannel(roomChannel);

    return () => {
      supabase.removeChannel(roomChannel);
      resetBattleStore();
      resetUI();
    };
  }, [roomCode, setRoom, resetBattleStore, resetUI]);

  // Opponent name
  const opponentName = players.find((p) => p !== myName) || '';

  // 2. WEBRTC FACE CAM CAMERAS & MIC INTEGRATION
  const { localStream, remoteStream, isWebRTCConnected } = useWebRTC({
    channel,
    myName,
    players,
  });

  const { isSpeaking: mySpeaking } = useAudioAnalyzer(localStream);
  const { isSpeaking: oppSpeaking } = useAudioAnalyzer(remoteStream);

  // 3. TYPING BROADCASTS
  const { broadcastTyping, opponentTyping } = useTypingBroadcast({
    channel,
    myName,
  });

  // 4. CANVAS RECORDER & CLIP EXPORT
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

  // Realtime Broadcast Listeners
  useEffect(() => {
    if (!channel) return;

    const sub = channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const activeUsers: string[] = [];
        for (const id in presenceState) {
          // @ts-ignore
          activeUsers.push(presenceState[id][0].playerName);
        }
        setPlayers(activeUsers);
      })
      .on('broadcast', { event: 'request_sync' }, () => {
        if (isHost && (playlist.length > 0 || roasts.length > 0)) {
          channel.send({
            type: 'broadcast',
            event: 'sync_data',
            payload: {
              playlist,
              currentVideoIndex,
              isPlaying,
              roasts,
              aiJudgments,
              battlePhase,
              winner,
              finalVerdict,
              mostCookedRoast,
              scores: Object.fromEntries(
                Object.entries(playerStates).map(([k, v]) => [k, v.score])
              ),
            },
          });
        }
      })
      .on('broadcast', { event: 'sync_data' }, (payload: any) => {
        const data = payload.payload;
        if (playlist.length === 0 && data.playlist.length > 0) {
          setPlaylist(data.playlist);
        }
        setCurrentVideoIndex(data.currentVideoIndex);
        setIsPlaying(data.isPlaying);
        setBattlePhase(data.battlePhase);

        // Sync player scores
        if (data.scores) {
          Object.entries(data.scores).forEach(([name, score]) => {
            updatePlayerState(name, { score: score as number });
          });
        }

        // Sync roasts
        if (roasts.length === 0 && data.roasts.length > 0) {
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
        const { phase } = payload.payload;
        setBattlePhase(phase);
      })
      .on('broadcast', { event: 'roast_rated' }, (payload: any) => {
        const { roastId, score, reaction, damageLevel, damageAmount, sender } = payload.payload;
        updateRoastScore(roastId, score, reaction, damageLevel);
        setLatestReaction(reaction);
        setAICommentary(`${sender.toUpperCase()} gets a rating of ${score}/10! "${reaction}"`);

        // Apply Damage & Visual Effects
        const target = sender === myName ? opponentName : myName;
        if (target) {
          dealDamage(target, damageAmount, damageLevel, roastId);

          // Triggers visual feedback
          triggerShake(damageLevel === 'critical' || damageLevel === 'heavy' ? 'heavy' : 'medium');
          triggerFlash('#ff2d55');

          // Popup reactions
          const emojis: Record<string, string> = {
            light: '⚡',
            medium: '🔥',
            heavy: '💀',
            critical: '💥',
          };
          queuePopup(
            damageLevel === 'critical' ? 'EMOTIONAL DAMAGE' : `${damageLevel.toUpperCase()} HIT`,
            emojis[damageLevel] || '🔥',
            damageLevel === 'critical' ? '#ff2d55' : '#facc15'
          );

          if (damageLevel === 'critical') {
            showEmotionalDamage('EMOTIONAL DAMAGE!');
          }
        }
      })
      .on('broadcast', { event: 'ai_verdict' }, (payload: any) => {
        const { winner: roundWinner, verdict: roundVerdict, damageScore } = payload.payload;

        // Save round judgment
        addAIJudgment({
          roundIndex: currentVideoIndex,
          winner: roundWinner,
          verdict: roundVerdict,
          damageScore,
          timestamp: Date.now(),
        });

        // Set judge commentary
        setAICommentary(`AI JUDGES ROUND: Winner is ${roundWinner}! "${roundVerdict}"`);

        // Deduct massive HP from the round loser
        const loser = roundWinner === myName ? opponentName : myName;
        if (loser) {
          dealDamage(loser, damageScore, 'critical', `judge-${currentVideoIndex}`);
          updatePlayerState(roundWinner, { score: (playerStates[roundWinner]?.score || 0) + 1 });

          triggerShake('heavy');
          triggerFlash('#ff2d55');
          showEmotionalDamage(`${roundWinner.toUpperCase()} ACCEPTS VICTORY!`);
        }
      })
      .on('broadcast', { event: 'battle_results' }, (payload: any) => {
        const { winner: finalWinner, verdict: finalVerdictText, mostCooked } = payload.payload;
        setWinner(finalWinner, finalVerdictText, mostCooked);
        setBattlePhase('results');
        stopRecording();
      });

    return () => {
      // Unsubscribe not needed as supabase.removeChannel handles it in parent useEffect
    };
  }, [
    channel,
    isHost,
    playlist,
    currentVideoIndex,
    isPlaying,
    roasts,
    aiJudgments,
    battlePhase,
    winner,
    finalVerdict,
    mostCookedRoast,
    myName,
    opponentName,
    playerStates,
    addAIJudgment,
    addRoast,
    dealDamage,
    queuePopup,
    setAICommentary,
    setBattlePhase,
    setCurrentVideoIndex,
    setIsPlaying,
    setLatestReaction,
    setPlayers,
    setPlaylist,
    setWinner,
    showEmotionalDamage,
    stopRecording,
    triggerFlash,
    triggerShake,
    updatePlayerState,
    updateRoastScore,
  ]);

  // Synchronize presence tracking once channel is fully ready
  useEffect(() => {
    if (channel) {
      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ playerName: myName });
          await channel.send({ type: 'broadcast', event: 'request_sync', payload: {} });
        }
      });
    }
  }, [channel, myName]);

  // --- LOBBY PLAYLIST QUEUE ---
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
      alert('Bhai, sirf YouTube Shorts link paste kar! (e.g. youtube.com/shorts/...)');
    }
  };

  // --- BATTLE CONTROL: COUNTDOWN OR ROUND START ---
  const handleStartBattle = async () => {
    if (playlist.length === 0) return;

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'phase_change',
        payload: { phase: 'countdown' },
      });
    }
    setBattlePhase('countdown');
  };

  // Countdown timer lifecycle
  useEffect(() => {
    if (battlePhase !== 'countdown') return;

    startCountdown(3);
    const interval = setInterval(() => {
      useUIStore.setState((state) => {
        if (state.countdownValue <= 1) {
          clearInterval(interval);
          endCountdown();

          if (isHost && channel) {
            channel.send({
              type: 'broadcast',
              event: 'phase_change',
              payload: { phase: 'battle' },
            });
            setIsPlaying(true);
            channel.send({
              type: 'broadcast',
              event: 'playlist_update',
              payload: { playlist, currentVideoIndex, isPlaying: true },
            });
          }
          setBattlePhase('battle');
          // Start Canvas Recording automatically
          startRecording();
          return { countdownValue: 0 };
        }
        return { countdownValue: state.countdownValue - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [battlePhase, isHost, channel, playlist, currentVideoIndex, startCountdown, endCountdown, setIsPlaying, startRecording]);

  // --- SUBMIT ROAST WITH AUTOMATIC REALTIME AI EVALUATION ---
  const handleSendRoast = async (text: string) => {
    if (!text.trim() || !channel) return;

    const currentVideoId = playlist[currentVideoIndex] || 'lobby';
    const roastId = `roast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newRoast = {
      id: roastId,
      sender: myName,
      text,
      videoId: currentVideoId,
      timestamp: Date.now(),
    };

    addRoast(newRoast);
    await channel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: newRoast,
    });

    // Reset typing status on submit
    broadcastTyping(false);

    // Call per-roast AI evaluation (sender calculates to balance API load, then broadcasts)
    try {
      const response = await reactToRoast(text, myName, `YouTube Shorts ID: ${currentVideoId}`);
      const damageAmount =
        response.score * (response.damageLevel === 'critical' ? 4 : response.damageLevel === 'heavy' ? 3 : 2);

      await channel.send({
        type: 'broadcast',
        event: 'roast_rated',
        payload: {
          roastId,
          score: response.score,
          reaction: response.reaction,
          damageLevel: response.damageLevel,
          damageAmount,
          sender: myName,
        },
      });

      // Update locally
      updateRoastScore(roastId, response.score, response.reaction, response.damageLevel);
      setLatestReaction(response.reaction);
      setAICommentary(`YOU get a rating of ${response.score}/10! "${response.reaction}"`);

      const target = opponentName;
      if (target) {
        dealDamage(target, damageAmount, response.damageLevel, roastId);
        triggerShake(response.damageLevel === 'critical' ? 'heavy' : 'medium');
        triggerFlash('#ff2d55');

        queuePopup(
          response.damageLevel === 'critical' ? 'EMOTIONAL DAMAGE' : 'GREAT ROAST',
          response.damageLevel === 'critical' ? '💥' : '🔥',
          '#ff2d55'
        );

        // Check if Game Over (HP drops to 0)
        const currentOppHP = useBattleStore.getState().playerStates[opponentName]?.hp ?? 100;
        if (currentOppHP <= 0 && isHost) {
          triggerFinalWinnerEvaluation();
        }
      }
    } catch (err) {
      console.error('Error rating roast:', err);
    }
  };

  // --- TRIGGER AI ROUND JUDGMENT OVERLAY ---
  const callAIJudge = async () => {
    if (!channel) return;

    setBattlePhase('judging');
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'phase_change',
        payload: { phase: 'judging' },
      });
    }

    try {
      const currentVideoId = playlist[currentVideoIndex];
      const videoChats = roasts.filter((r) => r.videoId === currentVideoId);

      const result = await judgeRound(videoChats, currentVideoId);

      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'ai_verdict',
          payload: result,
        });
      }

      // Add locally
      addAIJudgment({
        roundIndex: currentVideoIndex,
        winner: result.winner,
        verdict: result.verdict,
        damageScore: result.damageScore,
        timestamp: Date.now(),
      });

      setAICommentary(`AI JUDGES ROUND: Winner is ${result.winner}! "${result.verdict}"`);

      const loser = result.winner === myName ? opponentName : myName;
      if (loser) {
        dealDamage(loser, result.damageScore, 'critical', `judge-${currentVideoIndex}`);
        updatePlayerState(result.winner, { score: (playerStates[result.winner]?.score || 0) + 1 });
        triggerShake('heavy');
        triggerFlash('#ff2d55');
        showEmotionalDamage(`${result.winner.toUpperCase()} ACCEPTS VICTORY!`);
      }

      // Auto-progress after 8 seconds of showing round result
      setTimeout(() => {
        handleNextRoundProgress();
      }, 8000);
    } catch (err) {
      console.error('AI Judging failed:', err);
      setBattlePhase('battle');
    }
  };

  // --- PROGRESSION TO NEXT ROUND OR FINAL BATTLE SUMMARY ---
  const handleNextRoundProgress = async () => {
    if (currentVideoIndex < playlist.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      setCurrentRound(nextIndex);

      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'playlist_update',
          payload: { playlist, currentVideoIndex: nextIndex, isPlaying: true },
        });
        await channel.send({
          type: 'broadcast',
          event: 'phase_change',
          payload: { phase: 'countdown' },
        });
      }
      setBattlePhase('countdown');
    } else {
      // Playlist fully exhausted! Evaluate epic final victory stats!
      await triggerFinalWinnerEvaluation();
    }
  };

  const triggerFinalWinnerEvaluation = async () => {
    try {
      const scoreMap = Object.fromEntries(
        Object.entries(playerStates).map(([k, v]) => [k, v.score])
      );
      const results = await getFinalVerdict(roasts, scoreMap, playlist.length);

      // Find the highest rated roast in the battle
      const sortedRoasts = [...roasts].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      const mostCooked = sortedRoasts[0] || null;

      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'battle_results',
          payload: {
            winner: results.winner,
            verdict: results.verdict,
            mostCooked,
          },
        });
      }

      // Save locally and stop recording
      setWinner(results.winner, results.verdict, mostCooked);
      setBattlePhase('results');
      stopRecording();
    } catch (err) {
      console.error('Failed to trigger final results:', err);
    }
  };

  const onVideoEnd = () => {
    if (isHost && battlePhase === 'battle') {
      callAIJudge();
    }
  };

  return (
    <DamageOverlay>
      {/* 1. Main Grid Esports Layout */}
      <BattleLayout>
        {/* Top Header */}
        <BattleHeader
          roomCode={roomCode}
          onShare={async () => {
            const url = window.location.href;
            if (navigator.share) {
              await navigator.share({
                title: 'Roast Arena Combat Room',
                text: `Join the arena! Room code: ${roomCode}`,
                url,
              });
            } else {
              await navigator.clipboard.writeText(url);
              queuePopup('LINK COPIED', '📋', '#facc15');
            }
          }}
        />

        {/* 2. Synced Facecams (WebRTC) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col gap-4">
          <FaceCam
            stream={localStream}
            playerName={`${myName} (YOU)`}
            isLocal={true}
            hp={playerStates[myName]?.hp ?? 100}
            isSpeaking={mySpeaking}
            playerColor="yellow"
          />
          {opponentName && (
            <FaceCam
              stream={remoteStream}
              playerName={opponentName}
              isLocal={false}
              hp={playerStates[opponentName]?.hp ?? 100}
              isSpeaking={oppSpeaking}
              playerColor="cyan"
            />
          )}
        </div>

        {/* 3. Center Screen Showcase: Sync Shorts Video Player */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-between">
          {!isPlaying ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-arena-dark/70 rounded-3xl border border-zinc-800 p-6 text-center max-h-[640px] my-auto">
              <h2 className="text-arena-yellow font-black text-2xl uppercase mb-6 tracking-wide">
                ARENA LOBBY STAGING
              </h2>
              <div className="flex w-full gap-3 mb-6 max-w-lg">
                <input
                  type="text"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="PASTE YOUTUBE SHORTS LINK..."
                  className="flex-1 bg-black/60 border border-zinc-800 text-arena-yellow px-4 py-3.5 rounded-xl font-mono text-sm focus:border-arena-yellow outline-none uppercase"
                />
                <button
                  onClick={handleAddToQueue}
                  className="px-6 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-arena-yellow rounded-xl font-black text-sm uppercase transition-colors"
                >
                  ADD ➕
                </button>
              </div>

              {/* Playlist counts */}
              {playlist.length > 0 && (
                <div className="w-full max-w-lg text-left bg-black/40 border border-zinc-900 rounded-2xl p-4 mb-6">
                  <h3 className="text-zinc-500 font-bold text-xs uppercase mb-3 tracking-wider">
                    TIMELINE ROUNDS QUEUE ({playlist.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {playlist.map((id, index) => (
                      <div
                        key={index}
                        className="text-white font-mono text-xs py-2 px-3 bg-zinc-900/60 rounded-lg flex items-center justify-between border border-zinc-800/40"
                      >
                        <span className="text-arena-yellow">ROUND {index + 1}</span>
                        <span className="text-zinc-500 truncate max-w-[200px]">{id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {playlist.length > 0 && (
                <button
                  onClick={handleStartBattle}
                  className="px-10 py-4.5 bg-arena-yellow border border-yellow-600 hover:bg-yellow-500 text-black font-black uppercase rounded-2xl text-lg tracking-widest transition-all shadow-[0_0_30px_rgba(250,204,21,0.2)] active:scale-95"
                >
                  ENTER THE ARENA 🔥
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center max-h-[640px] my-auto">
              <YouTubePlayer
                videoId={playlist[currentVideoIndex]}
                onEnd={onVideoEnd}
              />
            </div>
          )}
        </div>

        {/* 4. Side/Bottom panels: Roast Feed + AI Judges */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col gap-4 max-h-[640px] overflow-hidden justify-between">
          <RoastFeed
            roasts={roasts.filter((r) => r.videoId === playlist[currentVideoIndex])}
            myName={myName}
          />
          <AIJudgePanel
            verdict={aiJudgments[aiJudgments.length - 1] || null}
            commentary={useBattleStore((state) => state.aiCommentary)}
            latestReaction={useBattleStore((state) => state.latestReaction)}
            isJudging={battlePhase === 'judging'}
          />
        </div>

        {/* 5. Roast Chat Input Area (with typing indicators) */}
        <div className="col-span-12 mt-4 relative">
          <RoastInput
            onSubmit={handleSendRoast}
            onTyping={() => broadcastTyping(true)}
            disabled={battlePhase !== 'battle'}
          />
          {opponentTyping && (
            <div className="absolute -top-7 left-4">
              🍳 {opponentName.toUpperCase()} is cooking... 🍳
            </div>
          )}
        </div>
      </BattleLayout>

      {/* 6. Gameplay Overlays & MODALS */}
      {/* 3-2-1 Full screen overlay countdown */}
      {showCountdown && <BattleCountdown />}

      {/* Popup floating text reactions */}
      <PopupReaction />

      {/* Dramatic Victory results overlay screen */}
      {battlePhase === 'results' && winner && (
        <VictoryScreen
          show={true}
          winner={winner}
          loser={winner === myName ? opponentName : myName}
          finalVerdict={finalVerdict || 'Sheer psychological wreckage.'}
          winnerScore={playerStates[winner]?.score || 0}
          loserScore={playerStates[winner === myName ? opponentName : myName]?.score || 0}
          mostCookedRoast={mostCookedRoast}
          onDownload={() => setShowExporter(true)}
          onClose={() => setBattlePhase('lobby')}
        />
      )}

      {/* Viral combat clip downloading preview modal */}
      {showExporter && clipBlob && (
        <ClipExporter
          clipBlob={clipBlob}
          onDownload={downloadClip}
          onClose={() => setShowExporter(false)}
        />
      )}
    </DamageOverlay>
  );
}