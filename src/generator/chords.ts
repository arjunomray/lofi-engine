import { ChordVoicing, ProgressionTemplate } from './types.js';
import { PRNG } from './prng.js';

export type CompingStyle = 
  | 'neo_soul_bounce'    // Syncopated stabs on 1, 2-and, and 4-and with ghost touches
  | 'bossa_push'         // Chords pushed 8th-note early, gentle bossa swing
  | 'fingerpicked_arpeggio' // Arpeggiated chord notes cascading like harp/guitar
  | 'ambient_pad'        // Long warm sustained chords with subtle restrikes
  | 'downtempo_stabs';   // Short, dampened, punchy Rhodes stabs

export interface ProgressionWithStyle {
  template: ProgressionTemplate;
  transposition: number;
  chords: ChordVoicing[];
  compingStyle: CompingStyle;
  isEightBar: boolean;
}

/**
 * Extensive library of authentic Lo-Fi, Neo-Soul, and Jazz chord progressions.
 * Features:
 * - Classic ii-V-I turnarounds
 * - Modal interchange (borrowed chords from parallel minor, e.g. iv minor in major)
 * - Passing diminished chords (C -> C#dim7 -> Dm7)
 * - Tritone substitutions & secondary dominants
 * - Bossa Nova and Japanese Anime chillhop chord sequences
 */
export const EXPANDED_LOFI_PROGRESSIONS: ProgressionTemplate[] = [
  // --- 1. CLASSIC JAZZ & NEO-SOUL TURNAROUNDS ---
  {
    name: "Tokyo Drizzle (ii9 - V13 - Imaj7 - VI7alt)",
    mood: "Nostalgic & Warm",
    key: "C Major",
    romanNumerals: ["ii9", "V13", "Imaj7", "VI7alt"],
    chords: [
      { name: "Dm9", root: "D", quality: "m9", midiNotes: [53, 57, 60, 64], durationBeats: 4 },
      { name: "G13", root: "G", quality: "13", midiNotes: [53, 59, 64, 69], durationBeats: 4 },
      { name: "Cmaj9", root: "C", quality: "maj9", midiNotes: [52, 55, 59, 62], durationBeats: 4 },
      { name: "A7b13", root: "A", quality: "9", midiNotes: [55, 61, 65, 69], durationBeats: 4 }
    ]
  },
  {
    name: "Midnight Study (i9 - VImaj7 - IIImaj9 - VII)",
    mood: "Melancholic & Focused",
    key: "A Minor",
    romanNumerals: ["i9", "VImaj7", "IIImaj9", "VII7"],
    chords: [
      { name: "Am9", root: "A", quality: "m9", midiNotes: [55, 60, 64, 71], durationBeats: 4 },
      { name: "Fmaj9", root: "F", quality: "maj9", midiNotes: [57, 60, 64, 67], durationBeats: 4 },
      { name: "Cmaj9", root: "C", quality: "maj9", midiNotes: [55, 59, 62, 64], durationBeats: 4 },
      { name: "Em9", root: "E", quality: "m9", midiNotes: [55, 59, 62, 66], durationBeats: 4 }
    ]
  },
  {
    name: "Coffee Shop Float (Imaj9 - IVmaj9)",
    mood: "Dreamy & Endless",
    key: "F Major",
    romanNumerals: ["Imaj9", "IVmaj9", "Imaj9", "IVmaj9"],
    chords: [
      { name: "Fmaj9", root: "F", quality: "maj9", midiNotes: [57, 60, 64, 67], durationBeats: 4 },
      { name: "Bbmaj9", root: "Bb", quality: "maj9", midiNotes: [57, 62, 65, 72], durationBeats: 4 },
      { name: "Fmaj9", root: "F", quality: "maj9", midiNotes: [60, 64, 67, 69], durationBeats: 4 },
      { name: "Bbmaj9", root: "Bb", quality: "maj9", midiNotes: [62, 65, 69, 72], durationBeats: 4 }
    ]
  },
  {
    name: "Cassette Rewind (i9 - bVII9 - bVImaj7 - V7alt)",
    mood: "Bossa Nostalgia",
    key: "D Minor",
    romanNumerals: ["i9", "bVII9", "bVImaj7", "V7alt"],
    chords: [
      { name: "Dm9", root: "D", quality: "m9", midiNotes: [53, 57, 60, 64], durationBeats: 4 },
      { name: "C9", root: "C", quality: "9", midiNotes: [52, 55, 58, 62], durationBeats: 4 },
      { name: "Bbmaj7", root: "Bb", quality: "maj7", midiNotes: [50, 53, 57, 60], durationBeats: 4 },
      { name: "A7alt", root: "A", quality: "9", midiNotes: [55, 61, 65, 70], durationBeats: 4 }
    ]
  },
  {
    name: "Warm Sunlight (ii11 - V9 - Imaj9 - IVmaj7)",
    mood: "Cozy & Uplifting",
    key: "Eb Major",
    romanNumerals: ["ii11", "V9", "Imaj9", "IVmaj7"],
    chords: [
      { name: "Fm11", root: "F", quality: "m11", midiNotes: [56, 60, 63, 70], durationBeats: 4 },
      { name: "Bb9", root: "Bb", quality: "9", midiNotes: [56, 62, 65, 72], durationBeats: 4 },
      { name: "Ebmaj9", root: "Eb", quality: "maj9", midiNotes: [55, 58, 62, 65], durationBeats: 4 },
      { name: "Abmaj7", root: "Ab", quality: "maj7", midiNotes: [55, 60, 63, 67], durationBeats: 4 }
    ]
  },

  // --- 2. JAPANESE ANIME & MODAL BORROWING (iv minor in major) ---
  {
    name: "Studio Ghibli Nostalgia (IVmaj7 - V7 - iii7 - vi7)",
    mood: "Bittersweet & Emotional",
    key: "F Major",
    romanNumerals: ["IVmaj7", "V7", "iii7", "vi7"],
    chords: [
      // The famous "Royal Road" progression of Japanese music
      { name: "Bbmaj7", root: "Bb", quality: "maj7", midiNotes: [57, 62, 65, 69], durationBeats: 4 },
      { name: "C7", root: "C", quality: "9", midiNotes: [58, 60, 64, 67], durationBeats: 4 },
      { name: "Am7", root: "A", quality: "m7", midiNotes: [55, 60, 64, 69], durationBeats: 4 },
      { name: "Dm9", root: "D", quality: "m9", midiNotes: [53, 57, 60, 64], durationBeats: 4 }
    ]
  },
  {
    name: "Rainy Shinjuku (Imaj7 - iv9 - Imaj7 - IVmaj9)",
    mood: "Deep Melancholy & Rain",
    key: "C Major",
    romanNumerals: ["Imaj7", "iv9", "Imaj7", "IVmaj9"],
    chords: [
      // iv minor borrowed from parallel minor (Fm9 in C major)
      { name: "Cmaj9", root: "C", quality: "maj9", midiNotes: [52, 55, 59, 62], durationBeats: 4 },
      { name: "Fm9", root: "F", quality: "m9", midiNotes: [53, 56, 60, 63], durationBeats: 4 },
      { name: "Cmaj7", root: "C", quality: "maj7", midiNotes: [52, 55, 59, 64], durationBeats: 4 },
      { name: "Fmaj9", root: "F", quality: "maj9", midiNotes: [53, 57, 60, 64], durationBeats: 4 }
    ]
  },

  // --- 3. PASSING DIMINISHED & CHROMATIC VOICE LEADING ---
  {
    name: "Autumn Walk (Imaj7 - #Idim7 - ii7 - V7)",
    mood: "Vintage Vinyl Swing",
    key: "Eb Major",
    romanNumerals: ["Imaj7", "#Idim7", "ii7", "V7"],
    chords: [
      // Chromatic bass walk: Eb -> E dim -> F -> Bb
      { name: "Ebmaj7", root: "Eb", quality: "maj7", midiNotes: [55, 58, 62, 67], durationBeats: 4 },
      { name: "Edim7", root: "E", quality: "dim7", midiNotes: [55, 58, 61, 64], durationBeats: 4 },
      { name: "Fm9", root: "F", quality: "m9", midiNotes: [56, 60, 63, 67], durationBeats: 4 },
      { name: "Bb13", root: "Bb", quality: "13", midiNotes: [56, 62, 65, 70], durationBeats: 4 }
    ]
  },

  // --- 4. DEEP NEO-SOUL 2-CHORD VAMPS ---
  {
    name: "Neon Bedroom (i9 - iv9)",
    mood: "Hypnotic Neo-Soul",
    key: "G Minor",
    romanNumerals: ["i9", "iv9", "i9", "iv9"],
    chords: [
      { name: "Gm9", root: "G", quality: "m9", midiNotes: [53, 57, 58, 62], durationBeats: 4 },
      { name: "Cm9", root: "C", quality: "m9", midiNotes: [51, 55, 58, 62], durationBeats: 4 },
      { name: "Gm9", root: "G", quality: "m9", midiNotes: [55, 58, 62, 65], durationBeats: 4 },
      { name: "Cm11", root: "C", quality: "m11", midiNotes: [53, 55, 58, 63], durationBeats: 4 }
    ]
  },
  {
    name: "Late Night Drive (vi9 - V9 - IVmaj9 - III7#9)",
    mood: "Late Night Cityscape",
    key: "F# Minor",
    romanNumerals: ["vi9", "V9", "IVmaj9", "III7#9"],
    chords: [
      { name: "F#m9", root: "F#", quality: "m9", midiNotes: [52, 56, 60, 64], durationBeats: 4 },
      { name: "E9", root: "E", quality: "9", midiNotes: [52, 56, 59, 62], durationBeats: 4 },
      { name: "Dmaj9", root: "D", quality: "maj9", midiNotes: [52, 57, 61, 64], durationBeats: 4 },
      { name: "C#7#9", root: "C#", quality: "9", midiNotes: [53, 57, 60, 64], durationBeats: 4 }
    ]
  }
];

export class ChordEngine {
  private prng: PRNG;

  constructor(prng: PRNG) {
    this.prng = prng;
  }

  /**
   * Selects a progression, picks a distinct comping playing style,
   * and transposes smoothly for harmonic variety.
   */
  public generateProgression(): ProgressionWithStyle {
    const template = this.prng.pick(EXPANDED_LOFI_PROGRESSIONS);
    const transposition = this.prng.randInt(-2, 2);

    const transposedChords: ChordVoicing[] = template.chords.map(c => ({
      ...c,
      midiNotes: c.midiNotes.map(n => n + transposition)
    }));

    // Pick a comping style based on probability
    const compingStyles: CompingStyle[] = [
      'neo_soul_bounce',
      'bossa_push',
      'fingerpicked_arpeggio',
      'ambient_pad',
      'downtempo_stabs'
    ];
    const compingStyle = this.prng.pick(compingStyles);

    return {
      template,
      transposition,
      chords: transposedChords,
      compingStyle,
      isEightBar: false
    };
  }

  public getBassMidi(rootNoteName: string, transposition: number = 0): number {
    const noteMap: Record<string, number> = {
      'C': 36, 'C#': 37, 'Db': 37,
      'D': 38, 'D#': 39, 'Eb': 39,
      'E': 40,
      'F': 41, 'F#': 42, 'Gb': 42,
      'G': 43, 'G#': 44, 'Ab': 44,
      'A': 45, 'A#': 46, 'Bb': 46,
      'B': 47
    };
    const base = noteMap[rootNoteName] || 36;
    let finalNote = base + transposition;
    // Keep bass strictly within warm punchy octave 1/2 (MIDI 33 to 48)
    while (finalNote < 33) finalNote += 12;
    while (finalNote > 48) finalNote -= 12;
    return finalNote;
  }
}

export function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const note = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}
