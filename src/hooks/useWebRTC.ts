'use client';

import { useState, useEffect, useRef } from 'react';
import { createPeer, PeerInstance } from '@/lib/webrtc';

interface UseWebRTCProps {
  channel: any;
  myName: string;
  players: string[];
}

export function useWebRTC({ channel, myName, players }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isWebRTCConnected, setIsWebRTCConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<PeerInstance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingSignalsRef = useRef<any[]>([]);

  // 1. Camera Access
  useEffect(() => {
    let active = true;
    console.log("[WebRTC] Requesting Camera/Mic...");

    async function initLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true,
        });
        console.log("[WebRTC] Camera accessed successfully.");
        if (active) {
          setLocalStream(stream);
          localStreamRef.current = stream;
        }
      } catch (err: any) {
        console.error('[WebRTC] Camera Error:', err);
        if (active) setError('Camera/Mic blocked!');
      }
    }

    initLocalStream();
    return () => {
      active = false;
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // 2. Peer Setup
  useEffect(() => {
    console.log(`[WebRTC State] Channel: ${!!channel}, Camera: ${!!localStream}, Total Players: ${players.length}`);
    
    if (!channel || !localStream || players.length < 2) {
      if (peerRef.current) {
        try { (peerRef.current as any).destroy(); } catch (e) {}
        peerRef.current = null;
        setIsWebRTCConnected(false);
        setRemoteStream(null);
      }
      return;
    }

    const opponent = players.find((p) => p !== myName);
    if (!opponent) {
      console.log("[WebRTC] No opponent found in players array!");
      return;
    }

    // Strict alphabetical logic so only one initiates
    const isInitiator = myName < opponent; 
    let active = true;

    async function setupPeer() {
      try {
        console.log(`[WebRTC] Creating Peer... Initiator: ${isInitiator}, Opponent: ${opponent}`);
        const peer = await createPeer(isInitiator, localStream!);
        
        if (!active) { peer.destroy(); return; }
        peerRef.current = peer;

        peer.on('signal', (signal) => {
          if (!active) return;
          console.log(`[WebRTC] Sending signal to ${opponent}`);
          channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { from: myName, to: opponent, signal },
          });
        });

        peer.on('stream', (stream) => {
          if (!active) return;
          console.log('[WebRTC] 🎉 OPPONENT STREAM RECEIVED!');
          setRemoteStream(stream);
          setIsWebRTCConnected(true);
        });

        // Check for pending queue
        if (pendingSignalsRef.current.length > 0) {
          console.log(`[WebRTC] Processing ${pendingSignalsRef.current.length} queued signals.`);
          pendingSignalsRef.current.forEach((sig) => {
            try { peer.signal(sig); } catch (e) {}
          });
          pendingSignalsRef.current = [];
        }

      } catch (err) {
        console.error('[WebRTC] Peer Setup Crash:', err);
      }
    }

    setupPeer();

    const channelSub = channel.on('broadcast', { event: 'webrtc-signal' }, (payload: any) => {
      if (!active) return; 
      const { from, to, signal } = payload.payload;
      
      if (to === myName && from === opponent) {
        console.log(`[WebRTC] Signal received from ${from}`);
        const isPeerAlive = peerRef.current && !(peerRef.current as any).destroyed;
        
        if (isPeerAlive) {
          try { peerRef.current!.signal(signal); } catch (e) {}
        } else {
          pendingSignalsRef.current.push(signal);
        }
      }
    });

    return () => {
      active = false; 
      if (peerRef.current) {
        try { (peerRef.current as any).destroy(); } catch (e) {}
        peerRef.current = null;
      }
      setIsWebRTCConnected(false);
      setRemoteStream(null);
      pendingSignalsRef.current = [];
    };
  }, [channel, localStream, players, myName]);

  return { localStream, remoteStream, isWebRTCConnected, error };
}