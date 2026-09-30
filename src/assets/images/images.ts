import manifest from './manifest.json';

/** Responsive WebP renditions of the illustrative campus artwork used behind the sign-in card. */
const urls = import.meta.glob('./*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type ImageSlug = keyof typeof manifest;

export interface CampusImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

export function getImage(slug: ImageSlug): CampusImage {
  const { widths, width, height } = manifest[slug];
  const entries = widths.map((w) => ({ w, url: urls[`./${slug}-${w}.webp`] }));
  const mid = entries[Math.min(1, entries.length - 1)];
  return {
    src: mid.url,
    srcSet: entries.map((e) => `${e.url} ${e.w}w`).join(', '),
    width,
    height,
  };
}

export { default as emblemUrl } from './emblem.png';
