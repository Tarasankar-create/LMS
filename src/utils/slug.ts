/** "B.Sc. Physics (Hons)" → "b-sc-physics-hons". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** A slug based on `text` that isn't already in `taken` (adds -2, -3… when needed). */
export function uniqueSlug(text: string, taken: readonly string[]): string {
  const base = slugify(text) || 'item';
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
