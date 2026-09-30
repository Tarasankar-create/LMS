/**
 * Deterministic PRNG (mulberry32) so seed data looks the same every time it
 * is (re)generated after a "Reset Demo Data" action, rather than reshuffling
 * randomly on every reset.
 */
export function createSeededRandom(seed: number) {
  let state = seed;
  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
