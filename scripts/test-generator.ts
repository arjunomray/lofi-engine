import { LoFiGenerator } from '../src/generator/index.js';
import { exportMidiBytes } from '../src/generator/exportMidi.js';
import { Midi } from '@tonejs/midi/dist/Midi.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Running Chunk 1 Unit Tests: Algorithmic Pattern Generator');
  console.log('='.repeat(60) + '\n');

  // Test 1: Seed Determinism
  const seed = 'test-seed-42';
  const songA = LoFiGenerator.generate({ seed });
  const songB = LoFiGenerator.generate({ seed });

  const bytesA = exportMidiBytes(songA);
  const bytesB = exportMidiBytes(songB);

  assert(
    Buffer.from(bytesA).equals(Buffer.from(bytesB)),
    'Seed Determinism: Identical seeds produce bit-for-bit identical MIDI output'
  );

  // Test 2: Different Seeds produce different songs
  const songC = LoFiGenerator.generate({ seed: 'another-seed-99' });
  const bytesC = exportMidiBytes(songC);
  assert(
    !Buffer.from(bytesA).equals(Buffer.from(bytesC)),
    'Seed Entropy: Different seeds produce distinct musical arrangements'
  );

  // Test 3: Four separate General MIDI tracks in export
  const parsedMidi = new Midi(bytesA);
  assert(parsedMidi.tracks.length === 4, `Track Separation: Contains exactly 4 tracks (got ${parsedMidi.tracks.length})`);

  const trackNames = parsedMidi.tracks.map(t => t.name);
  assert(trackNames.includes('Lo-Fi Rhodes / Keys'), 'Track 1: Contains Lo-Fi Rhodes / Keys');
  assert(trackNames.includes('Mellow Bass'), 'Track 2: Contains Mellow Bass');
  assert(trackNames.includes('Melody Lead'), 'Track 3: Contains Melody Lead');
  assert(trackNames.includes('Dilla Drums'), 'Track 4: Contains Dilla Drums');

  // Test 4: J Dilla lazy snare micro-timing delay verification
  const dillaSong = LoFiGenerator.generate({ seed: 'dilla-test', drumStyle: 'dilla_boom_bap' });
  const dillaMidi = new Midi(exportMidiBytes(dillaSong));
  const drumTrack = dillaMidi.tracks.find(t => t.name === 'Dilla Drums')!;
  const snareHits = drumTrack.notes.filter(n => n.midi === 38 || n.midi === 37); // Snare or Rimshot
  assert(snareHits.length >= 4, `Snare count: Found ${snareHits.length} snare hits across 4 bars`);

  // Beat duration for this tempo
  const secondsPerBeat = 60 / dillaSong.bpm;
  // Check the first snare hit (which targets beat 2, i.e. 1.0 * secondsPerBeat)
  const firstSnare = snareHits[0];
  const expectedBeat2 = 1.0 * secondsPerBeat;
  const delayMs = (firstSnare.time - expectedBeat2) * 1000;
  
  assert(
    delayMs > 5 && delayMs < 45,
    `J Dilla Groove: Snare is micro-timed behind the beat by ~${delayMs.toFixed(1)} ms`
  );

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All Chunk 1 Tests Passed Successfully!');
  console.log('='.repeat(60) + '\n');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
