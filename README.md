# Lo-Fi Music Sequencer & MIDI Generator

An algorithmic lo-fi music generator, sequencer, and real-time visualizer running entirely in the browser via the Web Audio API.

## Features

- **Algorithmic Music & MIDI Generation**: Generates chill jazz chord progressions (7ths, 9ths), basslines, melodies, and drum patterns with seedable PRNG, exportable directly to `.mid`.
- **J Dilla Swing & Humanized Groove**: Replicates unquantized microtiming with configurable 16th-note swing ratios (0.54–0.62), organic timing jitter, and signature "lazy snare" lag.
- **Procedural FM Rhodes & Sub-Bass**: Pure Web Audio synthesis featuring 2-operator FM electric piano tines, filtered harmonic sub-bass, and vinyl/tape saturation without external sample packs.
- **Svelte 60 FPS Visualizer**: Ultra-lightweight UI compiled to fine-grained direct DOM updates—eliminating Virtual DOM diffing bottlenecks to guarantee smooth 60 FPS canvas rendering.

## The Sound Engine

### J Dilla Swing
Instead of snapping rigidly to a grid (50% straight 16ths) or an exaggerated triplet shuffle (66.7%), the groove engine operates in Dilla's signature "in-between" pocket (~54% to 62% swing ratio). Key elements are decoupled:
- **Lazy Snare**: Snares on beats 2 and 4 are intentionally dragged 15–30ms behind the beat to create that laid-back, neck-snapping drag.
- **Micro-Jitter**: Sub-beat timing drifts organically by ±5–10ms to emulate unquantized MPC finger drumming.

### Procedural FM Rhodes & Sub-Bass
No heavy sample packs or audio files are downloaded; every sound is synthesized mathematically in real-time:
- **FM Rhodes**: Uses 2-operator Frequency Modulation. A sine wave carrier is modulated by an initial sharp frequency burst that decays exponentially in ~180ms, capturing the iconic glassy tine strike of a vintage Fender Rhodes, warmed up through a simulated cabinet low-pass filter.
- **Harmonic Sub-Bass**: Combines a pure sine wave (40–100 Hz) for physical low-end weight with a low-gain triangle wave to inject 2nd/3rd order harmonics, ensuring the bassline remains clearly audible on laptop and mobile speakers.

## Why Svelte (Instead of React)?

A real-time audio visualizer demands a rock-solid 60 FPS. React's Virtual DOM diffing, reconciliation cycles, and component re-render cascades introduce micro-stutters and frame drops that can hitch the canvas rendering pipeline.

Svelte compiles away into direct, surgical DOM updates with zero runtime Virtual DOM overhead, keeping the main thread free for smooth 60 FPS visual rendering.

