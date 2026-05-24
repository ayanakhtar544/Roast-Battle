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

  // Request local camera and microphone stream
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

  // Set up the simple-peer WebRTC connection once the channel and local stream are ready,
  // and we have two players in the room.
  useEffect(() => {
    if (!channel || !localStream || players.length < 2) {
      // Clean up previous peer if the room state becomes invalid
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
        setIsWebRTCConnected(false);
        setRemoteStream(null);
      }
      return;
    }

    // Determine opponent name
    const opponent = players.find((p) => p !== myName);
    if (!opponent) return;

    // The alphabetically-first player is the initiator
    const sorted = [...players].sort();
    const isInitiator = sorted[0] === myName;
    isInitiatorRef.current = isInitiator;

    let peerDestroyed = false;

    async function setupPeer() {
      try {
        console.log(`Setting up simple-peer: initiator=${isInitiator}, me=${myName}, opponent=${opponent}`);
        const peer = await createPeer(isInitiator, localStream!);
        if (peerDestroyed) {
          peer.destroy();
          return;
        }
        peerRef.current = peer;

        // When the peer has a signal to send, broadcast it via Supabase Realtime channel
        peer.on('signal', (signal) => {
          channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { from: myName, to: opponent, signal },
          });
        });

        // When remote stream is received
        peer.on('stream', (stream) => {
          console.log('Received remote WebRTC stream!');
          setRemoteStream(stream);
          setIsWebRTCConnected(true);
        });

        peer.on('connect', () => {
          console.log('WebRTC connection established!');
          setIsWebRTCConnected(true);
        });

        peer.on('close', () => {
          console.log('WebRTC connection closed.');
          setIsWebRTCConnected(false);
          setRemoteStream(null);
        });

        peer.on('error', (err) => {
          console.error('WebRTC simple-peer error:', err);
          setIsWebRTCConnected(false);
          setRemoteStream(null);
        });
      } catch (err: any) {
        console.error('Error creating simple-peer:', err);
        setError('Failed to establish WebRTC peer connection');
      }
    }

    setupPeer();

    // Listen to signaling messages
    const channelSub = channel.on('broadcast', { event: 'webrtc-signal' }, (payload: any) => {
      const { from, to, signal } = payload.payload;
      // Only process signals intended for me, from the opponent, and when peer exists
      if (to === myName && from === opponent && peerRef.current) {
        try {
          peerRef.current.signal(signal);
        } catch (err) {
          console.error('Error signaling simple-peer:', err);
        }
      }
    });

    return () => {
      peerDestroyed = true;
      if (peerRef.current) {
        peerRef.current.destroy();
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
