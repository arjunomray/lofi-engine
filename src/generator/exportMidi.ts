import { Midi } from '@tonejs/midi/dist/Midi.js';
import { GeneratedSong, TrackType } from './types.js';
import * as fs from 'fs/promises';

/**
 * Converts a GeneratedSong into a Standard MIDI File (SMF Format 1) binary buffer.
 * 
 * Tracks are mapped according to General MIDI (GM) standards:
 * - Track 0: Tempo & Time Signature
 * - Track 1: "Lo-Fi Keys (Rhodes)" - GM Instrument #4 (Electric Piano 1)
 * - Track 2: "Lo-Fi Bass" - GM Instrument #33 (Electric Bass finger)
 * - Track 3: "Melody" - GM Instrument #11 (Vibraphone)
 * - Track 4: "Drums" - Standard GM Channel 10 Drum Map
 */
export function exportMidiBytes(song: GeneratedSong): Uint8Array {
  const midi = new Midi();

  // Set Global Header info
  midi.header.name = `Lo-Fi Beat (Seed ${song.seed})`;
  midi.header.setTempo(song.bpm);

  // Track map for separating stems
  const tracks: Record<TrackType, ReturnType<typeof midi.addTrack>> = {
    keys: midi.addTrack(),
    bass: midi.addTrack(),
    melody: midi.addTrack(),
    drums: midi.addTrack()
  };

  // Configure Track Names & General MIDI Program Instruments
  tracks.keys.name = 'Lo-Fi Rhodes / Keys';
  tracks.keys.instrument.number = 4; // Electric Piano 1 (Rhodes)
  tracks.keys.channel = 0;

  tracks.bass.name = 'Mellow Bass';
  tracks.bass.instrument.number = 33; // Electric Bass (finger)
  tracks.bass.channel = 1;

  tracks.melody.name = 'Melody Lead';
  tracks.melody.instrument.number = 11; // Vibraphone / Lead
  tracks.melody.channel = 2;

  tracks.drums.name = 'Dilla Drums';
  tracks.drums.channel = 9; // In 0-indexed MIDI, Channel 9 is MIDI Channel 10 (Percussion)

  // Populate events into their respective tracks
  for (const event of song.events) {
    const targetTrack = tracks[event.track];
    if (targetTrack) {
      targetTrack.addNote({
        midi: event.midi,
        time: event.time,
        duration: event.duration,
        velocity: Math.max(0.01, Math.min(1.0, event.velocity))
      });
    }
  }

  return midi.toArray();
}

/**
 * Helper to write the Standard MIDI File directly to disk.
 */
export async function writeMidiFile(song: GeneratedSong, filePath: string): Promise<void> {
  const bytes = exportMidiBytes(song);
  await fs.writeFile(filePath, Buffer.from(bytes));
}
