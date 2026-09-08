import { GenerationOptions, GeneratedSong, NoteEvent } from './types.js';
import { PRNG } from './prng.js';
import { ChordEngine, midiToNoteName, CompingStyle } from './chords.js';
import { RhythmEngine } from './rhythm.js';
import { DrumEngine, DrumStyle } from './drums.js';

export class LoFiGenerator {
  /**
   * Generates a complete, deterministic Lo-Fi composition from a seed.
   */
  public static generate(options: GenerationOptions = {}): GeneratedSong {
    const seed = options.seed ?? Date.now();
    const prng = new PRNG(seed);
    const bpm = options.bpm ?? prng.randInt(74, 86);
    const bars = options.bars ?? 4;
    const swing = options.swing ?? prng.randFloat(0.55, 0.63);

    const rhythm = new RhythmEngine(prng, bpm);
    const chordEngine = new ChordEngine(prng);
    const drumEngine = new DrumEngine(prng, rhythm);

    const { template, transposition, chords, compingStyle } = chordEngine.generateProgression();
    const activeCompingStyle: CompingStyle = (options.compingStyle as CompingStyle) || compingStyle;

    const secondsPerBeat = rhythm.getSecondsPerBeat();
    const secondsPerBar = 4 * secondsPerBeat;
    const totalDurationSeconds = bars * secondsPerBar;

    const events: NoteEvent[] = [];

    // =========================================================================
    // 1. HARMONY: RHODES PIANO CHORD COMPING (RHYTHMIC STYLES)
    // =========================================================================
    let currentBar = 0;
    while (currentBar < bars) {
      for (const chord of chords) {
        if (currentBar >= bars) break;
        const barStart = currentBar * secondsPerBar;

        switch (activeCompingStyle) {
          // --- STYLE A: NEO-SOUL BOUNCE ---
          // Hit on beat 1, syncopated push on "and" of 2, stab on beat 4
          case 'neo_soul_bounce': {
            const hitSteps = [
              { step: 0, dur: 1.2 * secondsPerBeat, vel: 0.75 },
              { step: 6, dur: 0.8 * secondsPerBeat, vel: 0.65 }, // "and" of 2
              { step: 12, dur: 0.6 * secondsPerBeat, vel: 0.70 }, // beat 4
              { step: 14, dur: 0.4 * secondsPerBeat, vel: 0.45 }  // ghost push
            ];
            for (const h of hitSteps) {
              const hitTime = rhythm.getStepTime(currentBar, h.step, swing, 6);
              chord.midiNotes.forEach((pitch, idx) => {
                const strum = (idx * prng.randFloat(8, 16)) / 1000;
                events.push({
                  track: 'keys',
                  midi: pitch,
                  noteName: midiToNoteName(pitch),
                  time: hitTime + strum,
                  duration: h.dur,
                  velocity: rhythm.humanizeVelocity(h.vel, 0.05)
                });
              });
            }
            break;
          }

          // --- STYLE B: BOSSA NOVA PUSH ---
          // Chords anticipated by an 8th note, syncopated samba/bossa comping
          case 'bossa_push': {
            const bossaSteps = [
              { step: 0, dur: 1.1 * secondsPerBeat, vel: 0.72 },
              { step: 6, dur: 1.0 * secondsPerBeat, vel: 0.68 },
              { step: 10, dur: 0.7 * secondsPerBeat, vel: 0.60 },
              { step: 14, dur: 0.5 * secondsPerBeat, vel: 0.50 }
            ];
            for (const b of bossaSteps) {
              const hitTime = rhythm.getStepTime(currentBar, b.step, 0.54, 5);
              chord.midiNotes.forEach((pitch, idx) => {
                const strum = (idx * prng.randFloat(10, 18)) / 1000;
                events.push({
                  track: 'keys',
                  midi: pitch,
                  noteName: midiToNoteName(pitch),
                  time: hitTime + strum,
                  duration: b.dur,
                  velocity: rhythm.humanizeVelocity(b.vel, 0.04)
                });
              });
            }
            break;
          }

          // --- STYLE C: FINGERPICKED ARPEGGIO ---
          // Notes arpeggiated sequentially like a jazz guitar or harp
          case 'fingerpicked_arpeggio': {
            // Pick 8 arpeggio steps across the bar (8th notes)
            const sortedNotes = [...chord.midiNotes].sort((a, b) => a - b);
            for (let step = 0; step < 16; step += 2) {
              const noteIdx = (step / 2) % sortedNotes.length;
              const pitch = sortedNotes[noteIdx];
              const hitTime = rhythm.getStepTime(currentBar, step, swing, 6);
              events.push({
                track: 'keys',
                midi: pitch,
                noteName: midiToNoteName(pitch),
                time: hitTime,
                duration: 1.2 * secondsPerBeat, // Overlapping ring
                velocity: rhythm.humanizeVelocity(step === 0 ? 0.78 : 0.62, 0.06)
              });
            }
            break;
          }

          // --- STYLE D: DOWNTEMPO STABS ---
          // Short, punchy, dampened Rhodes stabs with lots of breathing space
          case 'downtempo_stabs': {
            const stabSteps = [
              { step: 0, vel: 0.82 },
              { step: 6, vel: 0.68 }
            ];
            for (const s of stabSteps) {
              const hitTime = rhythm.getStepTime(currentBar, s.step, swing, 6);
              chord.midiNotes.forEach((pitch, idx) => {
                const strum = (idx * 12) / 1000;
                events.push({
                  track: 'keys',
                  midi: pitch,
                  noteName: midiToNoteName(pitch),
                  time: hitTime + strum,
                  duration: 0.45 * secondsPerBeat, // Short decay
                  velocity: rhythm.humanizeVelocity(s.vel, 0.05)
                });
              });
            }
            break;
          }

          // --- STYLE E: AMBIENT PAD ---
          // Warm, sustained whole notes with gentle restrike
          case 'ambient_pad':
          default: {
            const chordDuration = chord.durationBeats * secondsPerBeat * 0.94;
            chord.midiNotes.forEach((pitch, idx) => {
              const strum = (idx * prng.randFloat(12, 24)) / 1000;
              events.push({
                track: 'keys',
                midi: pitch,
                noteName: midiToNoteName(pitch),
                time: barStart + strum,
                duration: chordDuration - strum,
                velocity: rhythm.humanizeVelocity(0.70, 0.05)
              });
            });
            // 40% chance of gentle restrike on beat 3.5
            if (prng.chance(0.4) && chord.durationBeats === 4) {
              const stabTime = barStart + (2.5 * secondsPerBeat);
              chord.midiNotes.forEach((pitch, idx) => {
                events.push({
                  track: 'keys',
                  midi: pitch,
                  noteName: midiToNoteName(pitch),
                  time: stabTime + (idx * 10) / 1000,
                  duration: 1.2 * secondsPerBeat,
                  velocity: rhythm.humanizeVelocity(0.50, 0.04)
                });
              });
            }
            break;
          }
        }

        currentBar += Math.ceil(chord.durationBeats / 4);
      }
    }

    // =========================================================================
    // 2. BASSLINE: ADAPTIVE TO COMPING STYLE
    // =========================================================================
    currentBar = 0;
    while (currentBar < bars) {
      for (const chord of chords) {
        if (currentBar >= bars) break;
        const barStart = currentBar * secondsPerBar;
        const rootMidi = chordEngine.getBassMidi(chord.root, transposition);

        if (activeCompingStyle === 'bossa_push') {
          // Bossa alternating Root - Fifth bassline (Root on 1, Fifth on 3)
          const fifthMidi = rootMidi + 7 <= 48 ? rootMidi + 7 : rootMidi - 5;
          events.push({
            track: 'bass',
            midi: rootMidi,
            noteName: midiToNoteName(rootMidi),
            time: barStart,
            duration: 1.6 * secondsPerBeat,
            velocity: rhythm.humanizeVelocity(0.85)
          });
          events.push({
            track: 'bass',
            midi: fifthMidi,
            noteName: midiToNoteName(fifthMidi),
            time: barStart + (2 * secondsPerBeat),
            duration: 1.6 * secondsPerBeat,
            velocity: rhythm.humanizeVelocity(0.78)
          });
        } else if (activeCompingStyle === 'neo_soul_bounce') {
          // Syncopated bouncy bass with chromatic pickup
          events.push({
            track: 'bass',
            midi: rootMidi,
            noteName: midiToNoteName(rootMidi),
            time: barStart,
            duration: 1.2 * secondsPerBeat,
            velocity: rhythm.humanizeVelocity(0.88)
          });
          // Hit on step 6 ("and" of 2)
          events.push({
            track: 'bass',
            midi: rootMidi,
            noteName: midiToNoteName(rootMidi),
            time: rhythm.getStepTime(currentBar, 6, swing, 4),
            duration: 0.8 * secondsPerBeat,
            velocity: rhythm.humanizeVelocity(0.75)
          });
          // Chromatic approach note on step 15
          if (prng.chance(0.6)) {
            const approach = prng.chance(0.5) ? rootMidi - 1 : rootMidi + 1;
            events.push({
              track: 'bass',
              midi: approach,
              noteName: midiToNoteName(approach),
              time: rhythm.getStepTime(currentBar, 15, swing, 4),
              duration: 0.25 * secondsPerBeat,
              velocity: rhythm.humanizeVelocity(0.65)
            });
          }
        } else {
          // Deep sustaining root with pickup
          events.push({
            track: 'bass',
            midi: rootMidi,
            noteName: midiToNoteName(rootMidi),
            time: barStart,
            duration: 2.2 * secondsPerBeat,
            velocity: rhythm.humanizeVelocity(0.86)
          });
          if (prng.chance(0.5)) {
            const pickupTime = barStart + (2.75 * secondsPerBeat);
            events.push({
              track: 'bass',
              midi: rootMidi,
              noteName: midiToNoteName(rootMidi),
              time: pickupTime,
              duration: 0.8 * secondsPerBeat,
              velocity: rhythm.humanizeVelocity(0.72)
            });
          }
        }

        currentBar += Math.ceil(chord.durationBeats / 4);
      }
    }

    // =========================================================================
    // 3. DRUMS: MULTI-ARCHETYPE RHYTHMS
    // =========================================================================
    // Map comping style to complementary drum style unless explicitly requested
    let targetDrumStyle: DrumStyle;
    if (options.drumStyle) {
      targetDrumStyle = options.drumStyle as DrumStyle;
    } else if (activeCompingStyle === 'bossa_push') {
      targetDrumStyle = 'bossa_cross_stick';
    } else if (activeCompingStyle === 'ambient_pad') {
      targetDrumStyle = prng.pick(['minimalist_bedroom', 'dilla_boom_bap']);
    } else if (activeCompingStyle === 'neo_soul_bounce') {
      targetDrumStyle = prng.pick(['dilla_boom_bap', 'chillhop_groover']);
    } else {
      targetDrumStyle = prng.pick(['dilla_boom_bap', 'chillhop_groover', 'minimalist_bedroom']);
    }

    const { events: drumEvents, style: actualDrumStyle } = drumEngine.generateDrums(bars, swing, targetDrumStyle);
    events.push(...drumEvents);

    // =========================================================================
    // 4. MELODY: CALL-AND-RESPONSE MOTIFS (PHRASING)
    // =========================================================================
    // Motif: 2-bar "Question", followed by 2-bar "Answer"
    const chord1 = chords[0];
    const chord3 = chords[Math.min(2, chords.length - 1)];

    // Generate a 3-note to 4-note motif for the "Call" (Bars 1 & 2)
    const motifScale = (chord1.midiNotes.map(n => n + 12)); // Higher octave chord tones
    const motifSteps = [2, 6, 10, 14];
    const motifNotes: { step: number; pitch: number }[] = [];

    for (const step of motifSteps) {
      if (prng.chance(0.75)) {
        motifNotes.push({
          step,
          pitch: prng.pick(motifScale)
        });
      }
    }

    // Place "The Call" in Bar 1 & 2
    for (const m of motifNotes) {
      events.push({
        track: 'melody',
        midi: m.pitch,
        noteName: midiToNoteName(m.pitch),
        time: rhythm.getStepTime(0, m.step, swing, 8),
        duration: prng.randFloat(0.4, 0.9) * secondsPerBeat,
        velocity: rhythm.humanizeVelocity(0.65, 0.05)
      });
    }

    // Place "The Response" in Bar 3 & 4 (Motif inverted or shifted to fit Chord 3)
    if (bars >= 4) {
      const responseScale = chord3.midiNotes.map(n => n + 12);
      for (const m of motifNotes) {
        // Nearest note in response scale
        const respPitch = prng.pick(responseScale);
        events.push({
          track: 'melody',
          midi: respPitch,
          noteName: midiToNoteName(respPitch),
          time: rhythm.getStepTime(2, m.step, swing, 8),
          duration: prng.randFloat(0.5, 1.1) * secondsPerBeat,
          velocity: rhythm.humanizeVelocity(0.68, 0.05)
        });
      }
    }

    // Sort all events chronologically
    events.sort((a, b) => a.time - b.time);

    return {
      seed,
      bpm,
      totalDurationSeconds,
      bars,
      progression: `${template.name} (${template.chords.map(c => c.name).join(' -> ')})`,
      compingStyle: activeCompingStyle,
      drumStyle: actualDrumStyle,
      events
    };
  }
}

export * from './types.js';
export type * from './types.js';
export * from './prng.js';
export * from './chords.js';
export * from './rhythm.js';
export * from './drums.js';
