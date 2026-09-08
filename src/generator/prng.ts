/**
 * PRNG (Pseudorandom Number Generator) using the Mulberry32 algorithm.
 * 
 * In algorithmic music generation:
 * - The seed acts as the DNA of a song.
 * - The exact same seed will always generate the exact same chords,
 *   melody, swing, velocities, and rhythm every single time.
 * - Changing the seed produces a brand-new variation.
 */
export class PRNG {
  private state: number;

  constructor(seed: number | string = Date.now()) {
    if (typeof seed === 'string') {
      this.state = this.hashString(seed);
    } else {
      this.state = seed | 0;
    }
  }

  /**
   * Hashes an arbitrary string (e.g. "rainy-tokyo", "late-night-study") into a 32-bit integer seed.
   */
  private hashString(str: string): number {
    let hash = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }
    return hash | 0;
  }

  /**
   * Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive).
   */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between min and max (both inclusive).
   */
  public randInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float between min and max.
   */
  public randFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Returns a randomly chosen item from an array.
   */
  public pick<T>(items: readonly T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /**
   * Returns true with probability `p` (0.0 to 1.0).
   */
  public chance(p: number): boolean {
    return this.next() < p;
  }
}
