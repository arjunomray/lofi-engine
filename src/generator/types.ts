/**
 * Musical and structural types for the Lo-Fi algorithmic pattern generator.
 */

export type TrackType = 'keys' | 'bass' | 'drums' | 'melody';

export interface NoteEvent {
  track: TrackType;
  midi: number;          // MIDI pitch number (0 - 127), e.g. 60 is C4
  noteName: string;      // Human-readable note name, e.g. "C4", "Eb3"
  time: number;          // Start time in seconds
  duration: number;      // Duration in seconds
  velocity: number;      // Dynamics/volume (0.0 to 1.0, or 1 to 127 in MIDI)
}

export type ChordQuality = 
  | 'maj7' 
  | 'm7' 
  | 'm9' 
  | 'maj9' 
  | '9' 
  | '11' 
  | 'm11' 
  | '13' 
  | 'dim7' 
  | 'add9';

export interface ChordVoicing {
  name: string;          // e.g. "Dm9", "G13", "Cmaj7"
  root: string;          // e.g. "D"
  quality: ChordQuality;
  midiNotes: number[];   // Array of MIDI pitches for piano chord voicing
  durationBeats: number; // e.g. 4 beats (1 bar) or 2 beats (half bar)
}

export interface ProgressionTemplate {
  name: string;
  mood: string;
  key: string;           // e.g. "C Major", "Eb Major", "D Minor"
  romanNumerals: string[]; // e.g. ["ii9", "V13", "Imaj7", "VI7"]
  chords: ChordVoicing[];
}

export interface GenerationOptions {
  seed?: number | string;
  bpm?: number;          // 70 to 88 BPM typical for Lo-Fi
  bars?: number;         // 4 or 8 bars loop length
  swing?: number;        // Swing factor (0.50 = straight, 0.58 - 0.65 = Dilla swing)
  humanizeVelocity?: number; // 0.0 to 0.3 velocity jitter
  humanizeTiming?: number;   // Max ms timing jitter (e.g. 15ms)
  compingStyle?: string;
  drumStyle?: string;
}

export interface GeneratedSong {
  seed: number | string;
  bpm: number;
  totalDurationSeconds: number;
  bars: number;
  progression: string;
  compingStyle: string;
  drumStyle: string;
  events: NoteEvent[];
}

/**
 * Standard General MIDI Drum Pitches (Channel 10)
 * These are universal across all DAW software, hardware, and web players.
 */
export const GM_DRUMS = {
  BASS_DRUM: 36,
  RIMSHOT: 37,
  ACOUSTIC_SNARE: 38,
  HAND_CLAP: 39,
  CLOSED_HIHAT: 42,
  PEDAL_HIHAT: 44,
  OPEN_HIHAT: 46,
  LOW_TOM: 45,
  MID_TOM: 47,
  HIGH_TOM: 50,
  CRASH_CYMBAL: 49,
  RIDE_CYMBAL: 51,
  TAMBOURINE: 54,
  CABASA: 69,
  MARACAS: 70
} as const;
