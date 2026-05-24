'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useBattleStore } from '@/stores/battleStore';

interface UseCanvasRecorderProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  opponentName: string;
}

export function useCanvasRecorder({
  localStream,
  remoteStream,
  opponentName,
}: UseCanvasRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [clipBlob, setClipBlob] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Hidden video elements to play the streams for canvas capture
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const { myName, playerStates, roasts, playlist, currentVideoIndex } = useBattleStore();
  const { damageFlash, flashColor, screenShake } = useUIStore();

  // Create hidden video elements to decode stream frames
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const localVideo = document.createElement('video');
    localVideo.muted = true;
    localVideo.playsInline = true;
    localVideo.autoplay = true;
    localVideoRef.current = localVideo;

    const remoteVideo = document.createElement('video');
    remoteVideo.muted = true;
    remoteVideo.playsInline = true;
    remoteVideo.autoplay = true;
    remoteVideoRef.current = remoteVideo;

    return () => {
      localVideo.srcObject = null;
      remoteVideo.srcObject = null;
      localVideo.remove();
      remoteVideo.remove();
    };
  }, []);

  // Update sources when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Background Grid & Cinematic Vignette
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    // Apply Screen Shake if active
    ctx.save();
    if (screenShake) {
      const shakeX = (Math.random() - 0.5) * 15;
      const shakeY = (Math.random() - 0.5) * 15;
      ctx.translate(shakeX, shakeY);
    }

    // Neon Grid Background (cyberpunk theme)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.05)';
    ctx.lineWidth = 2;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Draw Top Player Facecam (Opponent)
    const camW = w - 80;
    const camH = 340;
    const oppY = 160;

    // Draw Opponent camera box
    ctx.fillStyle = '#0f0f11';
    ctx.fillRect(40, oppY, camW, camH);

    if (remoteVideoRef.current && remoteStream && isRecording) {
      try {
        ctx.drawImage(remoteVideoRef.current, 40, oppY, camW, camH);
      } catch (e) {
        // Fallback placeholder
        ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
        ctx.fillRect(40, oppY, camW, camH);
      }
    } else {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.fillRect(40, oppY, camW, camH);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAMERA DISCONNECTED', w / 2, oppY + camH / 2 + 10);
    }

    // Draw Opponent border and HP
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, oppY, camW, camH);

    const opponentState = playerStates[opponentName] || { hp: 100, score: 0 };
    const opponentHp = opponentState.hp;

    // HP Bar background track
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(40, oppY + camH - 24, camW, 24);
    // HP Bar actual health
    const oppHpWidth = (camW * opponentHp) / 100;
    const oppHpColor = opponentHp > 60 ? '#39ff14' : opponentHp > 30 ? '#facc15' : '#ff2d55';
    ctx.fillStyle = oppHpColor;
    ctx.fillRect(40, oppY + camH - 24, oppHpWidth, 24);

    // Opponent Name and score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 28px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${opponentName.toUpperCase()}`, 60, oppY - 20);
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${opponentState.score}`, w - 60, oppY - 20);

    // 3. Draw Center YouTube/Round Sync Showcase
    const ytY = oppY + camH + 60;
    const ytW = camW;
    const ytH = 500;

    // Outer Neon Glow border
    ctx.shadowColor = 'rgba(250, 204, 21, 0.4)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, ytY, ytW, ytH);
    ctx.shadowBlur = 0; // reset shadow

    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(40, ytY, ytW, ytH);

    // YouTube Styled Center Artwork
    const currentVideoId = playlist[currentVideoIndex] || 'NO VIDEO';
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(w / 2, ytY + ytH / 2, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 20, ytY + ytH / 2 - 35);
    ctx.lineTo(w / 2 + 30, ytY + ytH / 2);
    ctx.lineTo(w / 2 - 20, ytY + ytH / 2 + 35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(250, 204, 21, 0.8)';
    ctx.font = 'black 32px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOW COOKING SHORT', w / 2, ytY + 80);

    ctx.fillStyle = '#8e8e93';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`ID: ${currentVideoId}`, w / 2, ytY + ytH - 60);

    // 4. Draw Bottom Player Facecam (Local User)
    const myY = ytY + ytH + 60;

    ctx.fillStyle = '#0f0f11';
    ctx.fillRect(40, myY, camW, camH);

    if (localVideoRef.current && localStream && isRecording) {
      try {
        ctx.drawImage(localVideoRef.current, 40, myY, camW, camH);
      } catch (e) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
        ctx.fillRect(40, myY, camW, camH);
      }
    } else {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
      ctx.fillRect(40, myY, camW, camH);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAMERA DISCONNECTED', w / 2, myY + camH / 2 + 10);
    }

    // Draw My border and HP
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, myY, camW, camH);

    const myState = playerStates[myName] || { hp: 100, score: 0 };
    const myHp = myState.hp;

    // HP Bar background track
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(40, myY + camH - 24, camW, 24);
    // HP Bar actual health
    const myHpWidth = (camW * myHp) / 100;
    const myHpColor = myHp > 60 ? '#39ff14' : myHp > 30 ? '#facc15' : '#ff2d55';
    ctx.fillStyle = myHpColor;
    ctx.fillRect(40, myY + camH - 24, myHpWidth, 24);

    // My Name and score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 28px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${myName.toUpperCase()} (YOU)`, 60, myY - 20);
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${myState.score}`, w - 60, myY - 20);

    // 5. Draw Roast Captions Overlay (Subtitles at bottom center)
    const latestRoast = roasts[roasts.length - 1];
    if (latestRoast) {
      const textY = myY + camH + 80;

      // Caption Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(30, textY - 40, w - 60, 110);
      ctx.strokeStyle = '#ff2d55';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, textY - 40, w - 60, 110);

      // Render roast text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Outfit, sans-serif';
      ctx.textAlign = 'center';

      // Simple text wrapping for long roasts
      const words = latestRoast.text.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = w - 100;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Draw maximum 2 lines of captions
      if (lines[0]) ctx.fillText(lines[0].trim(), w / 2, textY);
      if (lines[1]) ctx.fillText(lines[1].trim(), w / 2, textY + 35);
    }

    // 6. Header Watermark and REC Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROAST ARENA', w / 2, 75);

    // Rec Red Dot
    ctx.fillStyle = '#ff2d55';
    ctx.beginPath();
    ctx.arc(80, 60, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff2d55';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('REC', 104, 69);

    // 7. Visual Impact Damage Flash Overlay
    if (damageFlash) {
      ctx.fillStyle = flashColor === 'red' ? 'rgba(255, 45, 85, 0.4)' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore(); // reset screen shake translation

    // Loop
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
  }, [
    isRecording,
    localStream,
    remoteStream,
    opponentName,
    myName,
    playerStates,
    roasts,
    playlist,
    currentVideoIndex,
    damageFlash,
    flashColor,
    screenShake,
  ]);

  const startRecording = useCallback(() => {
    if (isRecording) return;

    recordedChunksRef.current = [];

    // Create target offscreen canvas at standard 9:16 portrait resolution
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    canvasRef.current = canvas;

    setIsRecording(true);

    // Start drawing loops
    animationFrameRef.current = requestAnimationFrame(drawCanvas);

    // Set up media recorder
    try {
      const canvasStream = canvas.captureStream(30);

      // Add audio track from mic if available
      if (localStream && localStream.getAudioTracks().length > 0) {
        canvasStream.addTrack(localStream.getAudioTracks()[0]);
      }

      // Check supported formats
      let options = { mimeType: 'video/webm;codecs=vp8' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: '' }; // fallback to default
      }

      const mediaRecorder = new MediaRecorder(canvasStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setClipBlob(blob);
      };

      mediaRecorder.start(1000); // chunk every 1 second
      console.log('Canvas recording started!');
    } catch (e) {
      console.error('Error starting media recorder:', e);
    }
  }, [isRecording, drawCanvas, localStream]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    setIsRecording(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('Canvas recording stopped!');
    }

    canvasRef.current = null;
  }, [isRecording]);

  const downloadClip = useCallback(() => {
    if (!clipBlob) return;

    const url = URL.createObjectURL(clipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roast-arena-clip-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [clipBlob]);

  return {
    startRecording,
    stopRecording,
    downloadClip,
    isRecording,
    clipBlob,
  };
}
