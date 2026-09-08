import { NoteEvent, GM_DRUMS } from './types.js';
import { PRNG } from './prng.js';
import { RhythmEngine } from './rhythm.js';

export type DrumStyle = 
  | 'dilla_boom_bap'      // Heavy swing, syncopated kick, 20ms lazy snare
  | 'bossa_cross_stick'   // Latin/Bossa rimshot clave, constant gentle shaker, light kick
  | 'minimalist_bedroom'  // Very sparse, half-time rimshot on beat 3, muted hats
  | 'chillhop_groover';   // Upbeat, skipping 16th hats, open hat sizzles, punchy double-kick

export class DrumEngine {
  private prng: PRNG;
  private rhythm: RhythmEngine;

  constructor(prng: PRNG, rhythm: RhythmEngine) {
    this.prng = prng;
    this.rhythm = rhythm;
  }

  /**
   * Generates drums based on a randomly selected or specified drum style.
   */
  public generateDrums(totalBars: number, swingRatio: number = 0.58, explicitStyle?: DrumStyle): { events: NoteEvent[]; style: DrumStyle } {
    const style = explicitStyle || this.prng.pick<DrumStyle>([
      'dilla_boom_bap',
      'bossa_cross_stick',
      'minimalist_bedroom',
      'chillhop_groover'
    ]);

    const events: NoteEvent[] = [];

    switch (style) {
      case 'dilla_boom_bap':
        this.generateDillaBoomBap(events, totalBars, swingRatio);
        break;
      case 'bossa_cross_stick':
        this.generateBossaCrossStick(events, totalBars, swingRatio);
        break;
      case 'minimalist_bedroom':
        this.generateMinimalistBedroom(events, totalBars, swingRatio);
        break;
      case 'chillhop_groover':
        this.generateChillhopGroover(events, totalBars, swingRatio);
        break;
    }

    return { events, style };
  }

  // --- STYLE 1: DILLA BOOM-BAP ---
  private generateDillaBoomBap(events: NoteEvent[], totalBars: number, swingRatio: number) {
    const kickPatterns = [
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // steps 0, 7, 10
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0], // steps 0, 6, 11
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0]  // steps 0, 8, 10
    ];
    const kick = this.prng.pick(kickPatterns);

    for (let bar = 0; bar < totalBars; bar++) {
      // Kick
      for (let step = 0; step < 16; step++) {
        if (kick[step] === 1) {
          const time = this.rhythm.getStepTime(bar, step, swingRatio, 6);
          events.push({
            track: 'drums',
            midi: GM_DRUMS.BASS_DRUM,
            noteName: 'Kick',
            time,
            duration: 0.15,
            velocity: this.rhythm.humanizeVelocity(step === 0 ? 0.95 : 0.82)
          });
        }
      }

      // Snare on 2 and 4 (steps 4 and 12) with 20ms Dilla drag
      for (const snareStep of [4, 12]) {
        const baseTime = this.rhythm.getStepTime(bar, snareStep, swingRatio, 4);
        const time = this.rhythm.applyLazySnareDelay(baseTime, 22);
        events.push({
          track: 'drums',
          midi: GM_DRUMS.ACOUSTIC_SNARE,
          noteName: 'Snare',
          time,
          duration: 0.2,
          velocity: this.rhythm.humanizeVelocity(0.88, 0.05)
        });
      }

      // Ghost Snares
      for (const step of [7, 10, 14]) {
        if (this.prng.chance(0.35)) {
          events.push({
            track: 'drums',
            midi: GM_DRUMS.ACOUSTIC_SNARE,
            noteName: 'GhostSnare',
            time: this.rhythm.getStepTime(bar, step, swingRatio, 8),
            duration: 0.08,
            velocity: this.rhythm.humanizeVelocity(0.26, 0.05)
          });
        }
      }

      // Hi-Hats
      for (let step = 0; step < 16; step++) {
        if (step % 2 === 0 || this.prng.chance(0.6)) {
          const time = this.rhythm.getStepTime(bar, step, swingRatio, 5);
          const isAccented = step === 0 || step === 8;
          events.push({
            track: 'drums',
            midi: GM_DRUMS.CLOSED_HIHAT,
            noteName: 'ClosedHat',
            time,
            duration: 0.08,
            velocity: this.rhythm.humanizeVelocity(isAccented ? 0.72 : 0.44, 0.07)
          });
        }
      }
    }
  }

  // --- STYLE 2: BOSSA NOVA CROSS-STICK ---
  private generateBossaCrossStick(events: NoteEvent[], totalBars: number, swingRatio: number) {
    // Classic Bossa Nova Rimshot Clave pattern: 
    // Hit on: step 0 (beat 1), step 6 (and of 2), step 10 (beat 3.5), step 12 (beat 4)
    const bossaRimSteps = [0, 6, 10, 12];

    for (let bar = 0; bar < totalBars; bar++) {
      // Soft thumb kick on beat 1 and 3
      for (const kickStep of [0, 8]) {
        events.push({
          track: 'drums',
          midi: GM_DRUMS.BASS_DRUM,
          noteName: 'Kick',
          time: this.rhythm.getStepTime(bar, kickStep, 0.52, 4),
          duration: 0.12,
          velocity: this.rhythm.humanizeVelocity(0.65, 0.05)
        });
      }

      // Organic Cross-Stick Rimshot
      for (const step of bossaRimSteps) {
        events.push({
          track: 'drums',
          midi: GM_DRUMS.RIMSHOT,
          noteName: 'Rimshot',
          time: this.rhythm.getStepTime(bar, step, 0.54, 5),
          duration: 0.15,
          velocity: this.rhythm.humanizeVelocity(0.80, 0.06)
        });
      }

      // Continuous Shaker / Maracas on all 16th notes with dynamic wave
      for (let step = 0; step < 16; step++) {
        const isAccent = step % 4 === 2; // Accent on offbeat
        events.push({
          track: 'drums',
          midi: GM_DRUMS.MARACAS,
          noteName: 'Shaker',
          time: this.rhythm.getStepTime(bar, step, 0.54, 4),
          duration: 0.06,
          velocity: this.rhythm.humanizeVelocity(isAccent ? 0.55 : 0.28, 0.04)
        });
      }
    }
  }

  // --- STYLE 3: MINIMALIST BEDROOM ---
  private generateMinimalistBedroom(events: NoteEvent[], totalBars: number, swingRatio: number) {
    for (let bar = 0; bar < totalBars; bar++) {
      // Pillowy kick only on beat 1 (step 0), occasional skip on step 11
      events.push({
        track: 'drums',
        midi: GM_DRUMS.BASS_DRUM,
        noteName: 'Kick',
        time: this.rhythm.getStepTime(bar, 0, swingRatio, 4),
        duration: 0.18,
        velocity: this.rhythm.humanizeVelocity(0.80, 0.04)
      });
      if (this.prng.chance(0.5)) {
        events.push({
          track: 'drums',
          midi: GM_DRUMS.BASS_DRUM,
          noteName: 'Kick',
          time: this.rhythm.getStepTime(bar, 10, swingRatio, 6),
          duration: 0.14,
          velocity: this.rhythm.humanizeVelocity(0.60, 0.05)
        });
      }

      // Half-time Rimshot strictly on Beat 3 (step 8)
      const baseRim = this.rhythm.getStepTime(bar, 8, swingRatio, 4);
      events.push({
        track: 'drums',
        midi: GM_DRUMS.RIMSHOT,
        noteName: 'Rimshot',
        time: this.rhythm.applyLazySnareDelay(baseRim, 18),
        duration: 0.15,
        velocity: this.rhythm.humanizeVelocity(0.72, 0.05)
      });

      // Very soft, sparse pedal hi-hats on beats 2 and 4
      for (const hatStep of [4, 12]) {
        events.push({
          track: 'drums',
          midi: GM_DRUMS.PEDAL_HIHAT,
          noteName: 'PedalHat',
          time: this.rhythm.getStepTime(bar, hatStep, swingRatio, 5),
          duration: 0.08,
          velocity: this.rhythm.humanizeVelocity(0.38, 0.04)
        });
      }
    }
  }

  // --- STYLE 4: CHILLHOP GROOVER ---
  private generateChillhopGroover(events: NoteEvent[], totalBars: number, swingRatio: number) {
    for (let bar = 0; bar < totalBars; bar++) {
      // Bouncy kick: Beat 1 (0), Beat 2.5 (6), Beat 4 (12)
      for (const step of [0, 6, 11]) {
        events.push({
          track: 'drums',
          midi: GM_DRUMS.BASS_DRUM,
          noteName: 'Kick',
          time: this.rhythm.getStepTime(bar, step, swingRatio, 5),
          duration: 0.14,
          velocity: this.rhythm.humanizeVelocity(step === 0 ? 0.96 : 0.78, 0.05)
        });
      }

      // Snare on 4 and 12 layered with Hand Clap
      for (const step of [4, 12]) {
        const time = this.rhythm.applyLazySnareDelay(this.rhythm.getStepTime(bar, step, swingRatio, 3), 16);
        events.push({
          track: 'drums',
          midi: GM_DRUMS.ACOUSTIC_SNARE,
          noteName: 'Snare',
          time,
          duration: 0.18,
          velocity: this.rhythm.humanizeVelocity(0.85, 0.04)
        });
        events.push({
          track: 'drums',
          midi: GM_DRUMS.HAND_CLAP,
          noteName: 'Clap',
          time: time + 0.008, // Micro clap flam
          duration: 0.12,
          velocity: this.rhythm.humanizeVelocity(0.55, 0.05)
        });
      }

      // Fast skipping 16th hats with open hat on step 14
      for (let step = 0; step < 16; step++) {
        const isOpen = step === 14;
        const time = this.rhythm.getStepTime(bar, step, swingRatio, 4);
        events.push({
          track: 'drums',
          midi: isOpen ? GM_DRUMS.OPEN_HIHAT : GM_DRUMS.CLOSED_HIHAT,
          noteName: isOpen ? 'OpenHat' : 'ClosedHat',
          time,
          duration: isOpen ? 0.3 : 0.07,
          velocity: this.rhythm.humanizeVelocity(isOpen ? 0.80 : (step % 2 === 0 ? 0.65 : 0.40))
        });
      }
    }
  }
}
