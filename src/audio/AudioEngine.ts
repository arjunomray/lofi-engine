import { GeneratedSong, NoteEvent, GM_DRUMS } from '../generator/types.js';
import { PlaybackState, LoFiDSPParams, DEFAULT_DSP_PARAMS, AudioVisualData } from './types.js';
import { LookaheadScheduler } from './Scheduler.js';
import { RhodesSynth } from './synths/RhodesSynth.js';
import { BassSynth } from './synths/BassSynth.js';
import { DrumSynth } from './synths/DrumSynth.js';
import { LeadSynth } from './synths/LeadSynth.js';
import { LoFiFilter } from './dsp/LoFiFilter.js';
import { TapeEffects } from './dsp/TapeEffects.js';
import { VinylNoise } from './dsp/VinylNoise.js';
import { SidechainDucker } from './dsp/Sidechain.js';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private scheduler: LookaheadScheduler | null = null;

  // Synths
  private rhodes: RhodesSynth | null = null;
  private bass: BassSynth | null = null;
  private drums: DrumSynth | null = null;
  private lead: LeadSynth | null = null;

  // DSP Nodes
  private lofiFilter: LoFiFilter | null = null;
  private tapeEffects: TapeEffects | null = null;
  private vinylNoise: VinylNoise | null = null;
  private sidechain: SidechainDucker | null = null;

  // Master & Visualizer Nodes
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // State
  private state: PlaybackState = 'stopped';
  private currentSong: GeneratedSong | null = null;
  private params: LoFiDSPParams = { ...DEFAULT_DSP_PARAMS };

  // Frequency analysis arrays
  private freqDataArray: Uint8Array | null = null;
  private timeDataArray: Float32Array | null = null;

  /**
   * Initializes the Web Audio graph on user gesture (click/tap).
   */
  public async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Master Output & Analyser (For Visualizer)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.params.masterVolume;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;

    this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDataArray = new Float32Array(this.analyser.fftSize);

    // Route: MasterGain -> Analyser -> Speakers
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // 2. Initialize DSP Chain
    this.lofiFilter = new LoFiFilter(this.ctx, this.params.filterCutoff, this.params.filterResonance);
    this.tapeEffects = new TapeEffects(this.ctx, this.params.tapeWobbleDepth, this.params.tapeWobbleSpeed);
    this.vinylNoise = new VinylNoise(this.ctx, this.params.vinylVolume);
    this.sidechain = new SidechainDucker(this.ctx, this.params.sidechainStrength);

    // 3. Routing:
    // Tape Output -> Lo-Fi Filter -> MasterGain
    this.tapeEffects.outputNode.connect(this.lofiFilter.node);
    this.lofiFilter.node.connect(this.masterGain);

    // Vinyl Noise -> MasterGain directly
    this.vinylNoise.outputNode.connect(this.masterGain);

    // 4. Initialize Synths
    this.rhodes = new RhodesSynth(this.ctx);
    this.bass = new BassSynth(this.ctx);
    this.drums = new DrumSynth(this.ctx);
    this.lead = new LeadSynth(this.ctx);

    // Rhodes Keys -> Sidechain Ducker -> Tape Input
    this.rhodes.outputNode.connect(this.sidechain.node);
    this.sidechain.node.connect(this.tapeEffects.inputNode);

    // Lead -> Tape Input
    this.lead.outputNode.connect(this.tapeEffects.inputNode);

    // Bass -> Tape Input (warm lowpass saturation)
    this.bass.outputNode.connect(this.tapeEffects.inputNode);

    // Drums -> MasterGain (bypasses tape delay to keep punchy transient attack)
    this.drums.outputNode.connect(this.masterGain);

    // 5. Initialize Scheduler
    this.scheduler = new LookaheadScheduler(this.ctx, (event, scheduledTime) => {
      this.dispatchNote(event, scheduledTime);
    });

    // Start background vinyl crackle
    this.vinylNoise.start(this.ctx);
  }

  /**
   * Dispatches a scheduled note to its appropriate synth voice.
   */
  private dispatchNote(event: NoteEvent, scheduledTime: number) {
    if (!this.ctx) return;

    switch (event.track) {
      case 'keys':
        this.rhodes?.playNote(event.midi, scheduledTime, event.duration, event.velocity);
        break;

      case 'bass':
        this.bass?.playNote(event.midi, scheduledTime, event.duration, event.velocity);
        break;

      case 'melody':
        this.lead?.playNote(event.midi, scheduledTime, event.duration, event.velocity);
        break;

      case 'drums':
        this.drums?.playDrum(event.midi, scheduledTime, event.velocity);
        // If kick, trigger sidechain ducking on the keys bus
        if (event.midi === GM_DRUMS.BASS_DRUM) {
          this.sidechain?.triggerDuck(scheduledTime);
        }
        break;
    }
  }

  /**
   * Loads and plays a GeneratedSong.
   */
  public async play(song?: GeneratedSong) {
    await this.init();
    if (!this.ctx || !this.scheduler) return;

    if (song) {
      this.currentSong = song;
      this.scheduler.loadSong(song);
    }

    if (this.currentSong) {
      this.scheduler.start();
      this.state = 'playing';
    }
  }

  public stop() {
    this.scheduler?.stop();
    this.state = 'stopped';
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public getCurrentSong(): GeneratedSong | null {
    return this.currentSong;
  }

  /**
   * Real-time DSP Parameter Updates
   */
  public updateParams(newParams: Partial<LoFiDSPParams>) {
    this.params = { ...this.params, ...newParams };
    if (!this.ctx) return;

    if (newParams.masterVolume !== undefined && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.params.masterVolume, this.ctx.currentTime, 0.02);
    }
    if (newParams.filterCutoff !== undefined && this.lofiFilter) {
      this.lofiFilter.setCutoff(this.params.filterCutoff, this.ctx);
    }
    if (newParams.filterResonance !== undefined && this.lofiFilter) {
      this.lofiFilter.setResonance(this.params.filterResonance, this.ctx);
    }
    if (newParams.tapeWobbleDepth !== undefined && this.tapeEffects) {
      this.tapeEffects.setDepth(this.params.tapeWobbleDepth, this.ctx);
    }
    if (newParams.tapeWobbleSpeed !== undefined && this.tapeEffects) {
      this.tapeEffects.setSpeed(this.params.tapeWobbleSpeed, this.ctx);
    }
    if (newParams.vinylVolume !== undefined && this.vinylNoise) {
      this.vinylNoise.setVolume(this.params.vinylVolume, this.ctx);
    }
    if (newParams.sidechainStrength !== undefined && this.sidechain) {
      this.sidechain.setStrength(this.params.sidechainStrength);
    }
  }

  public getParams(): LoFiDSPParams {
    return { ...this.params };
  }

  /**
   * Extracts real-time energy bands and waveforms for the 60 FPS Visualizer (Chunk 4).
   */
  public getVisualData(): AudioVisualData {
    if (!this.analyser || !this.freqDataArray || !this.timeDataArray) {
      return {
        bass: 0,
        mids: 0,
        highs: 0,
        waveform: new Float32Array(0),
        frequency: new Uint8Array(0)
      };
    }

    this.analyser.getByteFrequencyData(this.freqDataArray as any);
    this.analyser.getFloatTimeDomainData(this.timeDataArray);

    const binCount = this.analyser.frequencyBinCount; // 256 bins for fftSize 512
    const sampleRate = this.ctx?.sampleRate || 44100;
    const hzPerBin = sampleRate / 512; // ~86 Hz per bin

    // Bass: 20 Hz - 180 Hz (bins 0 to 2)
    let bassSum = 0;
    const bassBins = Math.max(1, Math.floor(180 / hzPerBin));
    for (let i = 0; i < bassBins; i++) bassSum += this.freqDataArray[i];
    const bass = bassSum / (bassBins * 255);

    // Mids: 250 Hz - 2500 Hz (bins ~3 to 29)
    let midSum = 0;
    const midStart = Math.floor(250 / hzPerBin);
    const midEnd = Math.floor(2500 / hzPerBin);
    for (let i = midStart; i < midEnd; i++) midSum += this.freqDataArray[i];
    const mids = midSum / ((midEnd - midStart) * 255);

    // Highs: 4000 Hz - 16000 Hz (bins ~46 to 186)
    let highSum = 0;
    const highStart = Math.floor(4000 / hzPerBin);
    const highEnd = Math.min(binCount, Math.floor(16000 / hzPerBin));
    for (let i = highStart; i < highEnd; i++) highSum += this.freqDataArray[i];
    const highs = highSum / ((highEnd - highStart) * 255);

    return {
      bass,
      mids,
      highs,
      waveform: this.timeDataArray,
      frequency: this.freqDataArray
    };
  }

  public getProgress(): number {
    return this.scheduler?.getPlaybackProgress() || 0;
  }
}
