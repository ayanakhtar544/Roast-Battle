// ===== SYNTHESIZED SOUND SYSTEM =====
// All sounds generated via Web Audio API — zero external files.

export type SoundType =
  | 'typing'
  | 'submit'
  | 'damage-light'
  | 'damage-heavy'
  | 'damage-critical'
  | 'ai-alert'
  | 'countdown'
  | 'countdown-go'
  | 'victory'
  | 'glitch';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private _isMuted = false;

  get isMuted(): boolean {
    return this._isMuted;
  }

  /** Must be called on a user interaction event (click/tap) to unlock audio. */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    // Resume in case browser suspended it
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean): void {
    this._isMuted = muted;
  }

  play(sound: SoundType): void {
    if (this._isMuted || !this.ctx) return;

    // Resume if suspended (e.g., after tab switch)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    switch (sound) {
      case 'typing':
        this.playTyping();
        break;
      case 'submit':
        this.playSubmit();
        break;
      case 'damage-light':
        this.playDamageLight();
        break;
      case 'damage-heavy':
        this.playDamageHeavy();
        break;
      case 'damage-critical':
        this.playDamageCritical();
        break;
      case 'ai-alert':
        this.playAiAlert();
        break;
      case 'countdown':
        this.playCountdown();
        break;
      case 'countdown-go':
        this.playCountdownGo();
        break;
      case 'victory':
        this.playVictory();
        break;
      case 'glitch':
        this.playGlitch();
        break;
    }
  }

  // ───── Individual sound synthesizers ─────

  /** Short click — 50ms, 800Hz square wave, quick decay */
  private playTyping(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** Whoosh — 200ms, frequency sweep 400→200Hz */
  private playSubmit(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Light thud — 150ms, 100Hz sine */
  private playDamageLight(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Heavy thud — 300ms, 60Hz sine + 200Hz */
  private playDamageHeavy(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    // Low rumble
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, t);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.3);

    // Mid punch
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(200, t);
    gain2.gain.setValueAtTime(0.2, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.2);
  }

  /** Explosion — 500ms, noise + 40Hz bass */
  private playDamageCritical(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(t);

    // Deep bass
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, t);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  /** Electronic beep — 200ms, 1200Hz → 800Hz */
  private playAiAlert(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Deep tick — 100ms, 200Hz */
  private playCountdown(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** Horn blast — 400ms, chord of 440+554+659 Hz */
  private playCountdownGo(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const freqs = [440, 554, 659];

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.setValueAtTime(0.12, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  /** Triumphant chord — 800ms, major chord arpeggio */
  private playVictory(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    // C major arpeggio: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.0, 523.25];
    const spacing = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * spacing);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + i * spacing + 0.05);
      gain.gain.setValueAtTime(0.18, t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * spacing);
      osc.stop(t + 0.8);
    });
  }

  /** Digital noise — 200ms, noise buffer with bitcrusher effect */
  private playGlitch(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    // Create a short noise buffer with digital artifacts
    const bufferSize = ctx.sampleRate * 0.2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Bitcrusher-style: quantize and add sample-rate reduction
    const crushBits = 4;
    const crushStep = 1 / Math.pow(2, crushBits);
    const srFactor = 8; // Sample rate reduction factor

    for (let i = 0; i < bufferSize; i++) {
      const sample = Math.random() * 2 - 1;
      // Bitcrush: quantize
      const crushed = Math.round(sample / crushStep) * crushStep;
      // Sample rate reduction: hold values
      if (i % srFactor === 0) {
        data[i] = crushed;
      } else {
        data[i] = data[i - (i % srFactor)] ?? crushed;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(gain).connect(ctx.destination);
    noise.start(t);
  }
}

/** Singleton sound manager instance */
export const soundManager = new SoundManager();
