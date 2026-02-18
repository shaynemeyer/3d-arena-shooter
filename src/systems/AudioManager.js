export class AudioManager {
  constructor() {
    this.context = null;
    this.sounds = {};
    this.masterVolume = 0.5;
    this.initialized = false;

    // Sound definitions (can be loaded from files or generated)
    this.soundDefinitions = {
      'shoot-player': { frequency: 440, duration: 0.1 },
      'shoot-enemy': { frequency: 220, duration: 0.1 },
      'hit': { frequency: 150, duration: 0.15 },
      'win': { frequency: 523, duration: 0.5 },
      'lose': { frequency: 110, duration: 0.8 }
    };

    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Create Web Audio context
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.initialized = false;
    }
  }

  playSound(soundName) {
    if (!this.initialized || !this.context) {
      return;
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const soundDef = this.soundDefinitions[soundName];
    if (!soundDef) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    try {
      // Generate sound using Web Audio API
      this.generateSound(soundDef.frequency, soundDef.duration);
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  }

  generateSound(frequency, duration) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    // Create envelope (attack, decay)
    const now = this.context.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Decay

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  async loadSoundFile(name, url) {
    if (!this.initialized) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds[name] = audioBuffer;
      console.log(`Loaded sound: ${name}`);
    } catch (error) {
      console.warn(`Failed to load sound ${name} from ${url}:`, error);
    }
  }

  playSoundBuffer(name) {
    if (!this.initialized || !this.sounds[name]) {
      return;
    }

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = this.sounds[name];
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    gainNode.gain.value = this.masterVolume;

    source.start(0);
  }

  setVolume(level) {
    this.masterVolume = Math.max(0, Math.min(1, level));
  }
}
