import { create } from 'zustand';

// ===== TYPES =====

export interface PopupReaction {
  id: string;
  text: string;
  emoji: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
  timestamp: number;
}

// ===== STORE =====

interface UIState {
  // Screen effects
  screenShake: boolean;
  shakeIntensity: 'light' | 'medium' | 'heavy';
  
  // Damage flash
  damageFlash: boolean;
  flashColor: string;
  
  // Glitch
  glitchActive: boolean;
  
  // Popups
  popupQueue: PopupReaction[];
  
  // Recording
  isRecording: boolean;
  recordingDuration: number;
  
  // Screens
  showVictoryScreen: boolean;
  showCountdown: boolean;
  countdownValue: number;
  
  // Audio
  isMuted: boolean;
  
  // Emotional damage popup
  emotionalDamageText: string | null;

  // Actions
  triggerShake: (intensity?: 'light' | 'medium' | 'heavy') => void;
  triggerFlash: (color?: string) => void;
  triggerGlitch: (duration?: number) => void;
  queuePopup: (text: string, emoji: string, color?: string) => void;
  removePopup: (id: string) => void;
  clearPopups: () => void;
  setRecording: (isRecording: boolean) => void;
  setRecordingDuration: (duration: number) => void;
  setVictoryScreen: (show: boolean) => void;
  startCountdown: (from?: number) => void;
  setCountdownValue: (value: number) => void;
  endCountdown: () => void;
  toggleMute: () => void;
  showEmotionalDamage: (text: string) => void;
  clearEmotionalDamage: () => void;
  resetUI: () => void;
}

// Popup reactions pool
const REACTION_POOL = [
  { text: 'EMOTIONAL DAMAGE', emoji: '🔥', color: '#ff2d55' },
  { text: 'CAREER ENDED', emoji: '💀', color: '#ff6b35' },
  { text: 'FATALITY', emoji: '⚡', color: '#facc15' },
  { text: 'NO SURVIVORS', emoji: '☠️', color: '#ff2d55' },
  { text: 'PSYCHOLOGICAL WARFARE', emoji: '🧠', color: '#a855f7' },
  { text: 'VIOLATION DETECTED', emoji: '🚨', color: '#ff2d55' },
  { text: 'CRITICAL HIT', emoji: '💥', color: '#ff6b35' },
  { text: 'DESTROYED', emoji: '🗑️', color: '#facc15' },
  { text: 'MENTAL BREAKDOWN', emoji: '😵', color: '#a855f7' },
  { text: 'SKILL ISSUE', emoji: '📉', color: '#22d3ee' },
];

export { REACTION_POOL };

export const useUIStore = create<UIState>((set, get) => ({
  screenShake: false,
  shakeIntensity: 'medium',
  damageFlash: false,
  flashColor: '#ff2d55',
  glitchActive: false,
  popupQueue: [],
  isRecording: false,
  recordingDuration: 0,
  showVictoryScreen: false,
  showCountdown: false,
  countdownValue: 3,
  isMuted: false,
  emotionalDamageText: null,

  triggerShake: (intensity = 'medium') => {
    set({ screenShake: true, shakeIntensity: intensity });
    const duration = intensity === 'light' ? 300 : intensity === 'medium' ? 400 : 600;
    setTimeout(() => set({ screenShake: false }), duration);
  },

  triggerFlash: (color = '#ff2d55') => {
    set({ damageFlash: true, flashColor: color });
    setTimeout(() => set({ damageFlash: false }), 400);
  },

  triggerGlitch: (duration = 300) => {
    set({ glitchActive: true });
    setTimeout(() => set({ glitchActive: false }), duration);
  },

  queuePopup: (text, emoji, color = '#ff2d55') => {
    const popup: PopupReaction = {
      id: `popup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text,
      emoji,
      x: 10 + Math.random() * 60,
      y: 20 + Math.random() * 40,
      color,
      timestamp: Date.now(),
    };
    set((state) => ({
      popupQueue: [...state.popupQueue.slice(-4), popup], // Keep max 5
    }));
    // Auto-remove after 2.5s
    setTimeout(() => {
      set((state) => ({
        popupQueue: state.popupQueue.filter((p) => p.id !== popup.id),
      }));
    }, 2500);
  },

  removePopup: (id) => set((state) => ({
    popupQueue: state.popupQueue.filter((p) => p.id !== id),
  })),

  clearPopups: () => set({ popupQueue: [] }),

  setRecording: (isRecording) => set({ isRecording }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),

  setVictoryScreen: (showVictoryScreen) => set({ showVictoryScreen }),

  startCountdown: (from = 3) => set({ showCountdown: true, countdownValue: from }),
  setCountdownValue: (countdownValue) => set({ countdownValue }),
  endCountdown: () => set({ showCountdown: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  showEmotionalDamage: (text) => {
    set({ emotionalDamageText: text });
    setTimeout(() => set({ emotionalDamageText: null }), 2000);
  },

  clearEmotionalDamage: () => set({ emotionalDamageText: null }),

  resetUI: () => set({
    screenShake: false,
    damageFlash: false,
    glitchActive: false,
    popupQueue: [],
    isRecording: false,
    recordingDuration: 0,
    showVictoryScreen: false,
    showCountdown: false,
    countdownValue: 3,
    emotionalDamageText: null,
  }),
}));
