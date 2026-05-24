'use client';

import { useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { useUIStore } from '@/stores/uiStore';
import { soundManager } from '@/lib/sounds';

export function useSoundEffects() {
  const { roasts, damageEvents, winner, battlePhase } = useBattleStore();
  const { glitchActive, isMuted } = useUIStore();

  const prevRoastsLength = useRef(roasts.length);
  const prevDamageEventsLength = useRef(damageEvents.length);
  const prevBattlePhase = useRef(battlePhase);
  const hasInitialized = useRef(false);

  // Initialize sound manager on the first click / interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInteraction = () => {
      if (!hasInitialized.current) {
        soundManager.init();
        hasInitialized.current = true;
        console.log('SoundManager initialized on interaction!');
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Update mute state in sound manager
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Subscribe to roast changes
  useEffect(() => {
    if (roasts.length > prevRoastsLength.current) {
      const latestRoast = roasts[roasts.length - 1];
      // Only play the sound if it's a recent change (not initial load sync)
      if (latestRoast) {
        soundManager.play('submit');
      }
    }
    prevRoastsLength.current = roasts.length;
  }, [roasts]);

  // Subscribe to damage events
  useEffect(() => {
    if (damageEvents.length > prevDamageEventsLength.current) {
      const latestDamage = damageEvents[damageEvents.length - 1];
      if (latestDamage) {
        const severity = latestDamage.type;
        if (severity === 'critical') {
          soundManager.play('damage-critical');
        } else if (severity === 'heavy') {
          soundManager.play('damage-heavy');
        } else {
          soundManager.play('damage-light');
        }
      }
    }
    prevDamageEventsLength.current = damageEvents.length;
  }, [damageEvents]);

  // Play digital glitch sound
  useEffect(() => {
    if (glitchActive) {
      soundManager.play('glitch');
    }
  }, [glitchActive]);

  // Subscribe to phase changes
  useEffect(() => {
    if (battlePhase !== prevBattlePhase.current) {
      if (battlePhase === 'countdown') {
        soundManager.play('countdown');
      } else if (battlePhase === 'battle' && prevBattlePhase.current === 'countdown') {
        soundManager.play('countdown-go');
      } else if (battlePhase === 'results' && winner) {
        soundManager.play('victory');
      }
    }
    prevBattlePhase.current = battlePhase;
  }, [battlePhase, winner]);
}
