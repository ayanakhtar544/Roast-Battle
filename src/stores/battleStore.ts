import { create } from 'zustand';

// ===== TYPES =====

export interface Roast {
  id: string;
  sender: string;
  text: string;
  audioData?: string;
  videoId?: string;
  timestamp: number;
  aiScore?: number;
  aiReaction?: string;
  damageLevel?: 'light' | 'medium' | 'heavy' | 'critical';
}

export interface AIJudgment {
  roundIndex: number;
  winner: string;
  verdict: string;
  damageScore: number;
  commentary?: string;
  timestamp: number;
}

export interface DamageEvent {
  id: string;
  target: 'player1' | 'player2';
  amount: number;
  type: 'light' | 'medium' | 'heavy' | 'critical';
  roastId: string;
  timestamp: number;
}

export type BattlePhase = 'lobby' | 'countdown' | 'battle' | 'judging' | 'results';

export interface PlayerState {
  name: string;
  hp: number;
  score: number;
  isTyping: boolean;
  isConnected: boolean;
}

// ===== STORE =====

interface BattleState {
  // Room
  roomCode: string;
  myName: string;
  players: string[];
  playerStates: Record<string, PlayerState>;

  // Battle
  battlePhase: BattlePhase;
  currentRound: number;
  totalRounds: number;
  roundTimeLeft: number;

  // Content
  playlist: string[];
  currentVideoIndex: number;
  isPlaying: boolean;

  // Roasts
  roasts: Roast[];
  
  // AI
  aiJudgments: AIJudgment[];
  aiCommentary: string | null;
  latestReaction: string | null;

  // Damage
  damageEvents: DamageEvent[];

  // Results
  winner: string | null;
  finalVerdict: string | null;
  mostCookedRoast: Roast | null;

  // Actions
  setRoom: (roomCode: string, myName: string) => void;
  setPlayers: (players: string[]) => void;
  updatePlayerState: (name: string, state: Partial<PlayerState>) => void;
  setBattlePhase: (phase: BattlePhase) => void;
  setCurrentRound: (round: number) => void;
  setRoundTimeLeft: (time: number) => void;

  setPlaylist: (playlist: string[]) => void;
  setCurrentVideoIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;

  addRoast: (roast: Roast) => void;
  updateRoastScore: (roastId: string, score: number, reaction: string, damageLevel: Roast['damageLevel']) => void;

  addAIJudgment: (judgment: AIJudgment) => void;
  setAICommentary: (commentary: string | null) => void;
  setLatestReaction: (reaction: string | null) => void;

  dealDamage: (target: string, amount: number, type: DamageEvent['type'], roastId: string) => void;
  addDamageEvent: (event: DamageEvent) => void;

  setWinner: (winner: string, verdict: string, mostCooked: Roast | null) => void;
  
  getCurrentVideoRoasts: () => Roast[];
  getPlayerHP: (name: string) => number;
  reset: () => void;
}

const initialState = {
  roomCode: '',
  myName: '',
  players: [],
  playerStates: {},
  battlePhase: 'lobby' as BattlePhase,
  currentRound: 0,
  totalRounds: 0,
  roundTimeLeft: 0,
  playlist: [],
  currentVideoIndex: 0,
  isPlaying: false,
  roasts: [],
  aiJudgments: [],
  aiCommentary: null,
  latestReaction: null,
  damageEvents: [],
  winner: null,
  finalVerdict: null,
  mostCookedRoast: null,
};

export const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,

  setRoom: (roomCode, myName) => set({ roomCode, myName }),
  
  setPlayers: (players) => set((state) => {
    const playerStates = { ...state.playerStates };
    players.forEach((name) => {
      if (!playerStates[name]) {
        playerStates[name] = { name, hp: 100, score: 0, isTyping: false, isConnected: true };
      } else {
        playerStates[name] = { ...playerStates[name], isConnected: true };
      }
    });
    return { players, playerStates };
  }),

  updatePlayerState: (name, updates) => set((state) => ({
    playerStates: {
      ...state.playerStates,
      [name]: { ...state.playerStates[name], ...updates },
    },
  })),

  setBattlePhase: (battlePhase) => set({ battlePhase }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setRoundTimeLeft: (roundTimeLeft) => set({ roundTimeLeft }),

  setPlaylist: (playlist) => set({ playlist, totalRounds: playlist.length }),
  setCurrentVideoIndex: (currentVideoIndex) => set({ currentVideoIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  addRoast: (roast) => set((state) => ({ roasts: [...state.roasts, roast] })),
  
  updateRoastScore: (roastId, score, reaction, damageLevel) => set((state) => ({
    roasts: state.roasts.map((r) => 
      r.id === roastId ? { ...r, aiScore: score, aiReaction: reaction, damageLevel } : r
    ),
  })),

  addAIJudgment: (judgment) => set((state) => ({ 
    aiJudgments: [...state.aiJudgments, judgment] 
  })),
  
  setAICommentary: (aiCommentary) => set({ aiCommentary }),
  setLatestReaction: (latestReaction) => set({ latestReaction }),

  dealDamage: (target, amount, type, roastId) => set((state) => {
    const playerStates = { ...state.playerStates };
    if (playerStates[target]) {
      playerStates[target] = {
        ...playerStates[target],
        hp: Math.max(0, playerStates[target].hp - amount),
      };
    }
    const event: DamageEvent = {
      id: `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      target: state.players.indexOf(target) === 0 ? 'player1' : 'player2',
      amount,
      type,
      roastId,
      timestamp: Date.now(),
    };
    return { playerStates, damageEvents: [...state.damageEvents, event] };
  }),

  addDamageEvent: (event) => set((state) => ({
    damageEvents: [...state.damageEvents, event],
  })),

  setWinner: (winner, finalVerdict, mostCookedRoast) => set({ 
    winner, finalVerdict, mostCookedRoast, battlePhase: 'results' 
  }),

  getCurrentVideoRoasts: () => {
    const state = get();
    const currentVideoId = state.playlist[state.currentVideoIndex];
    return state.roasts.filter((r) => r.videoId === currentVideoId);
  },

  getPlayerHP: (name) => {
    const state = get();
    return state.playerStates[name]?.hp ?? 100;
  },

  reset: () => set(initialState),
}));
