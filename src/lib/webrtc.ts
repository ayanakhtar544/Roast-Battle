import type { Instance as PeerInstance } from 'simple-peer';

// Exporting the type strictly so hooks can use it for Type Safety
export type { PeerInstance };

export const createPeer = async (isInitiator: boolean, stream: MediaStream): Promise<PeerInstance> => {
  // CRITICAL FIX: Next.js SSR se bachne ke liye dynamic import
  // Yeh ensure karta hai ki 'simple-peer' sirf client-side (browser) me execute ho
  const Peer = (await import('simple-peer')).default;

  return new Peer({
    initiator: isInitiator,
    stream: stream,
    trickle: true, // Faster connection establishment
    config: {
      iceServers: [
        // 1. Google's Free STUN Servers (Handles 80% of open network connections)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        
        // 2. OpenRelay Free Public TURN Servers (Handles strict Firewalls, College Wi-Fi, Jio 4G)
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        // TCP fallback just in case UDP is completely blocked by the ISP
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    }
  });
};