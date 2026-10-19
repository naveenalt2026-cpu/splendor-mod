class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private unlockPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('splendor_sound_muted');
      this.isMuted = saved === 'true';

      // Auto-register global capture-phase interaction listeners to unlock AudioContext immediately
      const unlockEvents = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
      const handleUserGesture = () => {
        this.unlock().catch(() => {});
        unlockEvents.forEach((evt) =>
          window.removeEventListener(evt, handleUserGesture, true)
        );
      };

      unlockEvents.forEach((evt) =>
        window.addEventListener(evt, handleUserGesture, { capture: true, passive: true })
      );
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  /**
   * Proactively unlocks the Web Audio API context upon first user gesture.
   * Plays a silent 1-sample buffer to force the browser audio hardware into 'running' state.
   */
  public async unlock(): Promise<void> {
    if (this.isUnlocked && this.ctx && this.ctx.state === 'running') {
      return;
    }
    if (this.unlockPromise) {
      return this.unlockPromise;
    }

    this.unlockPromise = (async () => {
      try {
        this.initCtx();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }

        // Silent 1-frame buffer to reliably prime iOS Safari and desktop Chrome audio pipelines
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);

        this.isUnlocked = true;
      } catch {
        // Will retry on subsequent user gestures if blocked
      } finally {
        this.unlockPromise = null;
      }
    })();

    return this.unlockPromise;
  }

  /**
   * Helper that executes a sound synthesis routine only when the AudioContext is confirmed
   * to be in the 'running' state, preventing dropped notes or premature expiration of timers.
   */
  private executeWithContext(callback: (ctx: AudioContext) => void): void {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.ctx.state === 'running') {
      callback(this.ctx);
    } else {
      this.unlock().then(() => {
        if (this.ctx && this.ctx.state === 'running' && !this.isMuted) {
          callback(this.ctx);
        }
      });
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('splendor_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('splendor_sound_muted', String(this.isMuted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playError() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch {}
    });
  }

  public playTokenPickup() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(1240, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } catch {}
    });
  }

  public playTakeToken() {
    this.playTokenPickup();
  }

  public playTokenDrop() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.09);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      } catch {}
    });
  }

  public playBuyCard() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);

          gain.gain.setValueAtTime(0.1, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.25);
        });
      } catch {}
    });
  }

  public playReserveCard() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } catch {}
    });
  }

  public playNobleVisit() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A major fanfare
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0.14, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.4);
        });
      } catch {}
    });
  }

  public playTurnChime() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, now);
        osc.frequency.setValueAtTime(1046.5, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } catch {}
    });
  }

  public playVictory() {
    this.executeWithContext((ctx) => {
      try {
        const now = ctx.currentTime;
        const fanfares = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        fanfares.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.12, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.5);
        });
      } catch {}
    });
  }
}

export const sound = new SoundEngine();
