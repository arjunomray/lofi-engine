import { LoFiGenerator } from '../src/generator/index.js';
import { writeMidiFile } from '../src/generator/exportMidi.js';
import * as path from 'path';
import * as fs from 'fs/promises';

async function main() {
  const args = process.argv.slice(2);
  let seedArg = '42';
  let outArg = '';
  let barsArg = 4;
  let bpmArg: number | undefined = undefined;

  for (const arg of args) {
    if (arg.startsWith('--seed=')) seedArg = arg.replace('--seed=', '');
    if (arg.startsWith('--out=')) outArg = arg.replace('--out=', '');
    if (arg.startsWith('--bars=')) barsArg = parseInt(arg.replace('--bars=', ''), 10);
    if (arg.startsWith('--bpm=')) bpmArg = parseInt(arg.replace('--bpm=', ''), 10);
  }

  const outDir = path.resolve(process.cwd(), 'output');
  await fs.mkdir(outDir, { recursive: true });

  const fileName = outArg || `lofi-beat-seed-${seedArg}.mid`;
  const outputPath = path.join(outDir, fileName);

  console.log('='.repeat(60));
  console.log(`🎵 Generating Lo-Fi Beat using Algorithmic Pattern Generator`);
  console.log(`🔑 Seed: "${seedArg}"`);
  console.log('='.repeat(60));

  const song = LoFiGenerator.generate({
    seed: seedArg,
    bars: barsArg,
    bpm: bpmArg
  });

  console.log(`\n📊 Song Metadata:`);
  console.log(`  • Tempo:             ${song.bpm} BPM`);
  console.log(`  • Progression:       ${song.progression}`);
  console.log(`  • Playing Style:     ${song.compingStyle.toUpperCase()}`);
  console.log(`  • Drum Groove:       ${song.drumStyle.toUpperCase()}`);
  console.log(`  • Length:            ${song.bars} Bars (~${song.totalDurationSeconds.toFixed(2)} seconds)`);
  console.log(`  • Total Note Events: ${song.events.length}`);

  // Count events per track
  const trackCounts: Record<string, number> = {};
  for (const ev of song.events) {
    trackCounts[ev.track] = (trackCounts[ev.track] || 0) + 1;
  }
  console.log(`\n🎼 Stem Breakdown:`);
  for (const [track, count] of Object.entries(trackCounts)) {
    console.log(`  • ${track.toUpperCase().padEnd(8)}: ${count} notes`);
  }

  await writeMidiFile(song, outputPath);

  console.log(`\n💾 Saved Standard MIDI File:`);
  console.log(`  👉 ${outputPath}`);

  console.log('\n' + '='.repeat(60));
  console.log(`🔍 HOW TO VERIFY THIS MIDI FILE ON EXTERNAL SITES:`);
  console.log(`1. Visit any free web MIDI player / visualizer:`);
  console.log(`   • Signal Web MIDI: https://signal.vercel.app/edit`);
  console.log(`   • Online Sequencer: https://onlinesequencer.net/import`);
  console.log(`   • MIDI Player & Visualizer: https://surikov.github.io/webaudiofont/`);
  console.log(`2. Drag and drop '${fileName}' into the site.`);
  console.log(`3. You will see 4 distinct tracks:`);
  console.log(`   - Track 1: Lo-Fi Rhodes / Keys (Jazz chord voicings)`);
  console.log(`   - Track 2: Mellow Bass`);
  console.log(`   - Track 3: Melody Lead`);
  console.log(`   - Track 4: Dilla Drums (Kick, Snare with 20ms drag, Hi-Hats)`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
