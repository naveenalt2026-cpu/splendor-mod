// Procedural Web Audio API Renaissance Ambient Soundtrack Engine
// Generates authentic Renaissance modal lute/harp arpeggios, warm viol drone pads, and crystal gem chimes

class RenaissanceAmbientMusic {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.45;
  private masterGain: GainNode | null = null;
  private loopTimer: number | null = null;
  private currentStep: number = 0;
  private droneGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private onStateChangeListeners: Array<(isPlaying: boolean, isMuted: boolean) => void> = [];

  // Renaissance Dorian/Mixolydian Chord Progression (D minor, C major, Bb major, A major, F major, Gm)
  // Each chord has [root, fifth, octave, tenth/third, twelfth] frequencies
  private chords = [
    // D minor (D3, A3, D4, F4, A4)
    { bass: 146.83, notes: [220.0, 293.66, 349.23, 440.0, 523.25] },
    // C major (C3, G3, C4, E4, G4)
    { bass: 130.81, notes: [196.0, 261.63, 329.63, 392.0, 523.25] },
    // Bb major (Bb2, F3, Bb3, D4, F4)
    { bass: 116.54, notes: [174.61, 233.08, 293.66, 349.23, 466.16] },
    // A major (A2, E3, A3, C#4, E4)
    { bass: 110.0, notes: [164.81, 220.0, 277.18, 329.63, 440.0] },
    // D minor (D3, A3, D4, F4, A4)
    { bass: 146.83, notes: [220.0, 293.66, 349.23, 440.0, 587.33] },
    // F major (F2, C3, F3, A3, C4)
    { bass: 87.31, notes: [130.81, 174.61, 220.0, 261.63, 349.23] },
    // G minor (G2, D3, G3, Bb3, D4)
    { bass: 98.0, notes: [146.83, 196.0, 233.08, 293.66, 392.0] },
    // A suspend to Major (A2, E3, A3, D4 -> C#4)
    { bass: 110.0, notes: [164.81, 220.0, 293.66, 277.18, 440.0] },
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('splendor_music_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private initAudio() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Synthesizes an organic plucked lute / harp string note
  private playPluckedNote(freq: number, time: number, intensity: number = 1.0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Plucked string characteristics: warm triangle body with sine fundamental
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2, time);

      // Lowpass filter simulates the decay of high frequency harmonics in gut/nylon strings
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(4.0, time);
      filter.frequency.setValueAtTime(freq * 3.5, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 220), time + 0.4);

      // Quick pluck attack (~8ms) and natural resonance decay (~1.8s)
      const baseGain = 0.14 * intensity;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(baseGain, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

      osc.connect(filter);
      oscHarmonic.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      oscHarmonic.start(time);
      osc.stop(time + 1.85);
      oscHarmonic.stop(time + 1.85);
    } catch {
      // Ignore audio synthesis errors on suspended context
    }
  }

  // Shimmering crystal gem chime (high register bell overtone)
  private playGemChime(freq: number, time: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.04, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 2.25);
    } catch {}
  }

  // Start continuous warm chamber drone (viol da gamba foundation)
  private startDrone(bassFreq: number) {
    if (!this.ctx || !this.masterGain) return;

    this.stopDrone();

    try {
      const droneG = this.ctx.createGain();
      droneG.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      droneG.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(bassFreq, this.ctx.currentTime);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(bassFreq * 1.5, this.ctx.currentTime); // fifth overtone

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(droneG);
      droneG.connect(this.masterGain);

      osc1.start();
      osc2.start();

      this.droneGain = droneG;
      this.droneOscs = [osc1, osc2];
    } catch {}
  }

  private stopDrone() {
    if (this.droneGain && this.ctx) {
      try {
        this.droneGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          this.droneOscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
          this.droneOscs = [];
          this.droneGain = null;
        }, 850);
      } catch {
        this.droneOscs = [];
        this.droneGain = null;
      }
    }
  }

  // Sequencer loop: plays arpeggios that step through Renaissance chord progressions
  private scheduleMeasure() {
    if (!this.isPlaying || !this.ctx || this.isMuted) return;

    const chord = this.chords[this.currentStep % this.chords.length];
    const now = this.ctx.currentTime;
    const noteStep = 0.38; // ~80 BPM arpeggio rhythm

    // Update drone root note smoothly
    this.startDrone(chord.bass);

    // Renaissance fingerpicked arpeggio pattern:
    // Bass note on beat 1, then rolling melodic notes across beats
    this.playPluckedNote(chord.bass * 2, now, 1.2);

    const patternIndices = [0, 1, 2, 4, 3, 2, 1, 0];
    patternIndices.forEach((pIdx, i) => {
      const freq = chord.notes[pIdx % chord.notes.length];
      const time = now + (i + 1) * noteStep;
      const intensity = i === 3 || i === 7 ? 0.9 : 0.7;
      this.playPluckedNote(freq, time, intensity);
    });

    // High crystal gem chime every other measure
    if (this.currentStep % 2 === 0) {
      const chimeFreq = chord.notes[chord.notes.length - 1] * 2;
      this.playGemChime(chimeFreq, now + 1.2);
    }

    const measureDurationMs = (patternIndices.length + 1) * noteStep * 1000;
    this.currentStep++;

    this.loopTimer = window.setTimeout(() => {
      this.scheduleMeasure();
    }, measureDurationMs - 50);
  }

  // Public Controls
  public start() {
    this.initAudio();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.notifyState();
    this.scheduleMeasure();
  }

  public stop() {
    this.isPlaying = false;
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.stopDrone();
    this.notifyState();
  }

  public toggle(): boolean {
    if (this.isPlaying && !this.isMuted) {
      this.setMuted(true);
    } else {
      this.setMuted(false);
      if (!this.isPlaying) {
        this.start();
      }
    }
    return !this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('splendor_music_muted', String(muted));
    }
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : this.volume, now + 0.3);
    }
    if (!muted && !this.isPlaying) {
      this.start();
    }
    this.notifyState();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Micro-interaction sound: plays a delicate gem resonance when hovering over interactive cards
  public playCardHover(toneIndex: 0 | 1 | 2 = 0) {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    try {
      const tones = [587.33, 659.25, 783.99]; // D5, E5, G5
      const freq = tones[toneIndex] || 659.25;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.48);
    } catch {}
  }

  // Subscribe to changes for UI equalizer buttons
  public subscribe(cb: (isPlaying: boolean, isMuted: boolean) => void) {
    this.onStateChangeListeners.push(cb);
    cb(this.isPlaying, this.isMuted);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== cb);
    };
  }

  private notifyState() {
    this.onStateChangeListeners.forEach((cb) => cb(this.isPlaying, this.isMuted));
  }
}

export const ambientMusic = new RenaissanceAmbientMusic();
