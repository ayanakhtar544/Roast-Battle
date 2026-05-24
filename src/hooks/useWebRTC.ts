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
  const isInitiatorRef = useRef(false);

  // 1. Request local camera and microphone stream
  useEffect(() => {
    let active = true;

    async function initLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true,
        });
        if (active) {
          setLocalStream(stream);
          localStreamRef.current = stream;
        }
      } catch (err: any) {
        console.error('Failed to get user media:', err);
        if (active) {
          setError('Camera/Mic permission denied or unavailable');
        }
      }
    }

    initLocalStream();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Set up the simple-peer WebRTC connection once channel and local stream are ready
  useEffect(() => {
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
    if (!opponent) return;

    const sorted = [...players].sort();
    const isInitiator = sorted[0] === myName;
    isInitiatorRef.current = isInitiator;

    let active = true; // Stale listener block karne ka flag

    async function setupPeer() {
      try {
        console.log(`Setting up simple-peer: initiator=${isInitiator}, me=${myName}, opponent=${opponent}`);
        const peer = await createPeer(isInitiator, localStream!);
        
        if (!active) {
          peer.destroy();
          return;
        }
        peerRef.current = peer;

        peer.on('signal', (signal) => {
          if (!active) return;
          channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { from: myName, to: opponent, signal },
          });
        });

        peer.on('stream', (stream) => {
          if (!active) return;
          console.log('Received remote WebRTC stream!');
          setRemoteStream(stream);
          setIsWebRTCConnected(true);
        });

        peer.on('connect', () => {
          if (!active) return;
          console.log('WebRTC connection established!');
          setIsWebRTCConnected(true);
        });

        peer.on('close', () => {
          if (!active) return;
          console.log('WebRTC connection closed.');
          setIsWebRTCConnected(false);
          setRemoteStream(null);
        });

        peer.on('error', (err) => {
          if (!active) return;
          console.error('WebRTC simple-peer error:', err);
          setIsWebRTCConnected(false);
          setRemoteStream(null);
        });
      } catch (err: any) {
        if (!active) return;
        console.error('Error creating simple-peer:', err);
        setError('Failed to establish WebRTC peer connection');
      }
    }

    setupPeer();

    // 3. Listen to signaling messages
    const channelSub = channel.on('broadcast', { event: 'webrtc-signal' }, (payload: any) => {
      if (!active) return; 
      
      const { from, to, signal } = payload.payload;
      
      // CRITICAL TS FIX: Explicit inline check taaki TypeScript ko pata chale 'peerRef.current' zinda hai
      if (
        to === myName && 
        from === opponent && 
        peerRef.current && 
        !(peerRef.current as any).destroyed
      ) {
        try {
          peerRef.current.signal(signal);
        } catch (err) {
          console.error('Error signaling simple-peer:', err);
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
    };
  }, [channel, localStream, players, myName]);

  return {
    localStream,
    remoteStream,
    isWebRTCConnected,
    error,
  };
}