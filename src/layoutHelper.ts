import type { Photo } from "./types";

/** Aspect ratio of each layout's primary cell. Used for matching photos to containers. */
export const CELL_ASPECTS: Record<string, number> = {
  fullscreen: 1920 / 1080,        // 1.78
  "split-two-h": 960 / 1080,      // 0.89 — good for portrait
  "split-two-v": 1920 / 538,      // 3.57 — good for landscape
  "three-layout-top": 1920 / 626, // 3.07
  "three-layout-bot": 960 / 452,  // 2.12
  "grid-four": 960 / 539,         // 1.78
  "asymmetric-left": 845 / 1070,  // 0.79 — good for portrait
  "asymmetric-right": 1075 / 533, // 2.02
  "blend-two": 1920 / 1080,       // 1.78
  "photo-wall": 1920 / 1080,      // 1.78 (varies per item)
};

/** Check if a photo is portrait (height > width * 1.05) */
export function isPortrait(photo: Photo): boolean {
  return photo.height > photo.width * 1.05;
}

/** Check if a photo is landscape (width > height * 1.05) */
export function isLandscape(photo: Photo): boolean {
  return photo.width > photo.height * 1.05;
}

/**
 * Ken Burns transform for contain mode with variable-speed pacing.
 * Photos move faster in the middle third, slower at edges for natural floating feel.
 */
export function kenBurns(
  photo: Photo,
  progress: number,
  intensity: number = 1,
): { scale: number; x: number; y: number } {
  // Smooth ease-in-out-quadratic for natural floating motion
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const portrait = isPortrait(photo);
  if (portrait) {
    const scale = 1 + intensity * 0.05 * (1 + Math.sin(eased * Math.PI) * 0.5);
    const x = Math.sin(eased * Math.PI * 0.6) * 10 * intensity;
    const y = (eased - 0.5) * 25 * intensity;
    return { scale, x, y };
  }
  const scale = 1 + intensity * 0.04 * eased;
  const x = (eased - 0.5) * 14 * intensity;
  const y = Math.sin(eased * Math.PI * 0.4) * 8 * intensity;
  return { scale, x, y };
}

/**
 * PhotoWall layout with large photos that fill the canvas.
 * Sizes are % of canvas width/height.
 */
export function photoWallLayout(
  photos: Photo[],
): Array<{ x: number; y: number; w: number; h: number; rot: number }> {
  const count = Math.min(photos.length, 5);
  if (count === 1) {
    return [{ x: 50, y: 50, w: 72, h: 78, rot: 0 }];
  }
  if (count === 2) {
    return [
      { x: 28, y: 50, w: 52, h: 62, rot: -2 },
      { x: 72, y: 50, w: 52, h: 62, rot: 2 },
    ];
  }
  if (count === 3) {
    return [
      { x: 50, y: 30, w: 48, h: 54, rot: -2 },
      { x: 28, y: 68, w: 46, h: 52, rot: 2 },
      { x: 72, y: 68, w: 46, h: 52, rot: 3 },
    ];
  }
  if (count === 4) {
    return [
      { x: 26, y: 28, w: 44, h: 50, rot: -2 },
      { x: 74, y: 28, w: 44, h: 50, rot: 2 },
      { x: 26, y: 72, w: 44, h: 50, rot: 3 },
      { x: 74, y: 72, w: 44, h: 50, rot: -1 },
    ];
  }
  // 5 photos
  return [
    { x: 50, y: 18, w: 42, h: 46, rot: -2 },
    { x: 22, y: 46, w: 38, h: 42, rot: 2 },
    { x: 50, y: 46, w: 42, h: 46, rot: -3 },
    { x: 78, y: 46, w: 38, h: 42, rot: 1 },
    { x: 50, y: 78, w: 42, h: 46, rot: 3 },
  ];
}

/** Check if a photo array contains both portrait and landscape photos */
export function hasMixedOrientation(photos: Photo[]): boolean {
  let hasPortrait = false;
  let hasLandscape = false;
  for (const p of photos) {
    if (isPortrait(p)) hasPortrait = true;
    else if (isLandscape(p)) hasLandscape = true;
    if (hasPortrait && hasLandscape) return true;
  }
  return false;
}
