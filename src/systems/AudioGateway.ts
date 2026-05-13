import type { AudioKey } from '../data/types';

export class AudioGateway {
  private ctx: AudioContext | null = null;
  private pendingPlays: AudioKey[] = [];
  private unlocked = false;

  unlock(): void {
    if (this.unlocked) return;
    try {
      this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.unlocked = true;
          this.flushPending();
        });
      } else {
        this.unlocked = true;
        this.flushPending();
      }
    } catch {
      // Web Audio not supported
    }
  }

  play(key: AudioKey): void {
    if (!this.unlocked) {
      this.pendingPlays.push(key);
      return;
    }
    this.playKey(key);
  }

  private flushPending(): void {
    this.pendingPlays.forEach(k => this.playKey(k));
    this.pendingPlays = [];
  }

  private playKey(key: AudioKey): void {
    if (!this.ctx) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const params = this.getSoundParams(key);
      osc.type = params.type;
      osc.frequency.setValueAtTime(params.freq, ctx.currentTime);
      if (params.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(params.freqEnd, ctx.currentTime + params.duration);
      }
      gain.gain.setValueAtTime(params.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + params.duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + params.duration);
    } catch {
      // silent fail
    }
  }

  private getSoundParams(key: AudioKey): {
    type: OscillatorType;
    freq: number;
    freqEnd?: number;
    duration: number;
    volume: number;
  } {
    switch (key) {
      case 'flip':
        return { type: 'sine', freq: 440, freqEnd: 660, duration: 0.15, volume: 0.4 };
      case 'perfect':
        return { type: 'sine', freq: 880, freqEnd: 1320, duration: 0.4, volume: 0.5 };
      case 'burnt':
        return { type: 'sawtooth', freq: 200, freqEnd: 80, duration: 0.3, volume: 0.3 };
      case 'customer_happy':
        return { type: 'sine', freq: 660, freqEnd: 880, duration: 0.25, volume: 0.4 };
      case 'customer_angry':
        return { type: 'square', freq: 300, freqEnd: 150, duration: 0.3, volume: 0.3 };
    }
  }
}
