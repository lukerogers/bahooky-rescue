// Opt-in Web Audio: locally bundled effects and a synthesized celebration melody.
export const BOING_SOUNDS = Object.freeze(Array.from({ length: 3 }, (_, index) => new URL(`../assets/boing${index + 1}.mp3`, import.meta.url).href));
export const FART_SOUNDS = Object.freeze(Array.from({ length: 5 }, (_, index) => new URL(`../assets/fart${index + 1}.mp3`, import.meta.url).href));
const CLIP_SOUNDS = [...BOING_SOUNDS, ...FART_SOUNDS];

export class GameAudio {
  constructor({ random = Math.random } = {}) {
    this.enabled = false;
    this.context = null;
    this.random = random;
    this.clipLoads = new Map();
    this.clipSources = new Set();
    this.playbackVersion = 0;
  }

  async unlock() {
    if (!this.enabled) return;
    try {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) { this.enabled = false; return; }
      this.context ||= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
      // Cache all effects on first opt-in, so wiggles/rescues play promptly.
      for (const sound of CLIP_SOUNDS) this.loadClip(sound);
    } catch { this.enabled = false; }
  }

  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) await this.unlock();
    else this.stop();
    return this.enabled;
  }

  tone(frequency, start, length, volume = 0.045, type = 'sine', endFrequency = frequency) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + length * .75);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + length);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + length + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  boing() {
    return this.playRandomClip(BOING_SOUNDS);
  }

  fart() {
    return this.playRandomClip(FART_SOUNDS);
  }

  loadClip(sound) {
    if (!this.clipLoads.has(sound)) {
      const loading = fetch(sound)
        .then(response => {
          if (!response.ok) throw new Error(`Could not load ${sound}`);
          return response.arrayBuffer();
        })
        .then(data => this.context.decodeAudioData(data))
        // A missing/unsupported clip must never interrupt play.
        .catch(() => null);
      this.clipLoads.set(sound, loading);
    }
    return this.clipLoads.get(sound);
  }

  async playRandomClip(sounds) {
    if (!this.enabled || this.context?.state !== 'running') return;
    const version = this.playbackVersion;
    const sound = sounds[Math.floor(this.random() * sounds.length)];
    const buffer = await this.loadClip(sound);
    // Don't play a late download after the player has muted or paused.
    if (!buffer || !this.enabled || this.context.state !== 'running' || version !== this.playbackVersion) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(.25, this.context.currentTime);
    source.connect(gain);
    gain.connect(this.context.destination);
    source.onended = () => {
      this.clipSources.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    this.clipSources.add(source);
    source.start();
  }

  celebrate() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    [261.63, 329.63, 392, 523.25, 659.25].forEach((note, index) => this.tone(note, now + index * .13, .24, .035));
  }

  stop() {
    this.playbackVersion++;
    for (const source of this.clipSources) source.stop();
    this.clipSources.clear();
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }
}
