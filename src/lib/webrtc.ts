import type SimplePeerType from 'simple-peer';

export type PeerInstance = SimplePeerType.Instance;

/**
 * Dynamically imports simple-peer (not SSR-safe, so must be lazy-loaded).
 */
async function getSimplePeer(): Promise<typeof SimplePeerType> {
  const mod = await import('simple-peer');
  // Handle both ESM default and CJS module shapes
  return (mod as any).default || mod;
}

/**
 * Creates a WebRTC peer connection using simple-peer.
 *
 * @param initiator - Whether this peer initiates the connection
 * @param localStream - The local media stream (camera + mic)
 * @returns A configured SimplePeer instance
 */
export async function createPeer(
  initiator: boolean,
  localStream: MediaStream
): Promise<PeerInstance> {
  const SimplePeer = await getSimplePeer();

  const peer = new SimplePeer({
    initiator,
    stream: localStream,
    trickle: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    },
  });

  return peer;
}
