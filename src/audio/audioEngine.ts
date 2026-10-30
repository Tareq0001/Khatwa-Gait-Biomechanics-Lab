export class AudioEngine {
  private ctx: AudioContext | null = null;
  private metronomeTimer: number | null = null;
  private isMetronomePlaying = false;
  private isFootstepsEnabled = true;
  private bpm = 110;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(180, newBpm));
    if (this.isMetronomePlaying) {
      this.stopMetronome();
      this.startMetronome();
    }
  }

  public getBpm(): number {
    return this.bpm;
  }

  public toggleMetronome(): boolean {
    this.initContext();
    if (this.isMetronomePlaying) {
      this.stopMetronome();
      return false;
    } else {
      this.startMetronome();
      return true;
    }
  }

  public startMetronome() {
    this.initContext();
    if (this.metronomeTimer) clearInterval(this.metronomeTimer);
    this.isMetronomePlaying = true;
    
    // Play immediately first beat
    this.playMetronomeTick();
    const intervalMs = (60 / this.bpm) * 1000;
    this.metronomeTimer = window.setInterval(() => {
      this.playMetronomeTick();
    }, intervalMs);
  }

  public stopMetronome() {
    if (this.metronomeTimer) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    this.isMetronomePlaying = false;
  }

  public isMetronomeOn(): boolean {
    return this.isMetronomePlaying;
  }

  public toggleFootsteps(): boolean {
    this.isFootstepsEnabled = !this.isFootstepsEnabled;
    return this.isFootstepsEnabled;
  }

  public areFootstepsOn(): boolean {
    return this.isFootstepsEnabled;
  }

  // Synthesizes a warm high-precision wooden-block click
  public playMetronomeTick(isAccent = false) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isAccent ? 1200 : 880;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Audio fallback handling
    }
  }

  // Natural physical footstep acoustic synthesizer
  public playFootstepSound(type: 'heel' | 'toe', intensity = 1.0) {
    if (!this.isFootstepsEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;

      if (type === 'heel') {
        // Heel strike: Low frequency damped impact thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        const startFreq = 110 * intensity;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.09);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        const vol = Math.min(0.6, 0.3 * intensity);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.1);
      } else {
        // Toe push-off: Crisp high-frequency friction flick
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1400, t);
        bandpass.Q.setValueAtTime(1.8, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18 * intensity, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noise.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + 0.045);
      }
    } catch {
      // Audio safety fallback
    }
  }

  // Futuristic UI feedback beep
  public playUIFeedback(pitch = 750) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.04);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // safe fallback
    }
  }
}

export const audioEngine = new AudioEngine();
