import type {
  PhotoManifest,
  CategoryFrameBudget,
  DisplayUnit,
  LayoutType,
  Photo,
} from "./types";
import { isPortrait, isLandscape, hasMixedOrientation } from "./layoutHelper";

const FPS = 30;
const OPENING_FRAMES = 300;
const ENDING_FRAMES = 360;
const TITLE_FRAMES = 120;

function photosPerLayout(type: LayoutType): number {
  switch (type) {
    case "fullscreen": return 1;
    case "split-two": case "blend-two": return 2;
    case "three-layout": case "asymmetric": return 3;
    case "grid-four": return 4;
    case "photo-wall": return 4;
  }
}

function baseFramesPerUnit(type: LayoutType): number {
  switch (type) {
    case "fullscreen": return 90;
    case "split-two": return 120;
    case "three-layout": return 150;
    case "grid-four": return 180;
    case "asymmetric": return 150;
    case "photo-wall": return 170;
    case "blend-two": return 120;
  }
}

export function calculateFrameBudgets(manifest: PhotoManifest): CategoryFrameBudget[] {
  const photosAvailable = manifest.duration * FPS - OPENING_FRAMES - ENDING_FRAMES;
  const titlesTotal = manifest.categories.length * TITLE_FRAMES;
  const photosTotal = photosAvailable - titlesTotal;

  const weights = manifest.categories.map((cat) => {
    return cat.photos.length * (cat.emphasis ? 1.2 : 1.0);
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let offset = OPENING_FRAMES;
  const budgets: CategoryFrameBudget[] = [];

  for (let i = 0; i < manifest.categories.length; i++) {
    const cat = manifest.categories[i];
    const catFrames = Math.round((photosTotal * weights[i]) / totalWeight);
    const titleStart = offset;
    offset += TITLE_FRAMES;
    const photosStart = offset;

    const prevLastUnit = budgets.length > 0
      ? budgets[budgets.length - 1].units[budgets[budgets.length - 1].units.length - 1]
      : undefined;

    const units = groupPhotosIntoUnits(
      cat.photos,
      catFrames,
      cat.emphasis,
      prevLastUnit?.type,
      prevLastUnit?.animationVariant ?? 0,
    );

    budgets.push({
      name: cat.name,
      title: cat.title,
      photos: cat.photos,
      emphasis: cat.emphasis,
      titleStart,
      photosStart,
      photosDuration: catFrames,
      units,
    });

    offset += catFrames;
  }

  return budgets;
}

function groupPhotosIntoUnits(
  photos: Photo[],
  totalFrames: number,
  emphasis: boolean,
  prevLayout?: LayoutType,
  prevAnimVariant?: number,
): DisplayUnit[] {
  if (photos.length === 0) return [];

  let animVariant = (prevAnimVariant ?? -1) + 1;
  let lastLayout: LayoutType | undefined = prevLayout;

  // Step 1: Split photos into orientation-based groups
  // Consecutive same-orientation photos stay together
  interface Group { photos: Photo[]; isPortrait: boolean }
  const groups: Group[] = [];
  let currentGroup: Group | null = null;

  for (const p of photos) {
    const pOrient = isPortrait(p);
    if (currentGroup && currentGroup.isPortrait === pOrient) {
      currentGroup.photos.push(p);
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { photos: [p], isPortrait: pOrient };
    }
  }
  if (currentGroup) groups.push(currentGroup);

  // Step 1.5: Merge consecutive small alternating-orientation groups
  // Avoids rapid single-photo cuts when orientations alternate
  const mergedGroups: Group[] = [];
  let i = 0;
  while (i < groups.length) {
    const g = groups[i];
    // Only merge isolated 1-2 photo groups that alternate orientation
    if (g.photos.length <= 2 && i + 1 < groups.length) {
      const batch: Group[] = [g];
      let j = i + 1;
      while (j < groups.length && groups[j].photos.length <= 2 && groups[j].isPortrait !== batch[batch.length - 1].isPortrait) {
        batch.push(groups[j]);
        j++;
      }
      if (batch.length >= 3) {
        // Merge into one mixed-orientation group — photo-wall handles this well
        const merged: Photo[] = [];
        for (const bg of batch) merged.push(...bg.photos);
        mergedGroups.push({ photos: merged, isPortrait: merged.filter(p => isPortrait(p)).length > merged.length / 2 });
        i = j;
        continue;
      }
    }
    mergedGroups.push(g);
    i++;
  }

  // Step 2: Build units from groups, fitting layout count to group size
  const rawUnits: { type: LayoutType; count: number }[] = [];

  for (const group of mergedGroups) {
    let remaining = group.photos.length;
    let idx = 0;

    while (remaining > 0) {
      // For portrait groups of 4: split into 2+2 (two horizontal splits)
      if (group.isPortrait && remaining === 4) {
        rawUnits.push({ type: "split-two", count: 2 });
        rawUnits.push({ type: "split-two", count: 2 });
        remaining = 0;
        break;
      }
      // For portrait groups of 3: use a 3-photo portrait-friendly layout
      if (group.isPortrait && remaining === 3) {
        const lt = chooseLayoutForGroup(group.photos.slice(idx, idx + 3), true, lastLayout, animVariant);
        const cap = Math.min(remaining, photosPerLayout(lt));
        rawUnits.push({ type: lt, count: cap });
        remaining -= cap;
        idx += cap;
        lastLayout = lt;
        animVariant++;
        continue;
      }
      // For landscape groups of >=4: use grid-four
      if (!group.isPortrait && remaining >= 4 && !hasMixedOrientation(group.photos.slice(idx, idx + 4))) {
        rawUnits.push({ type: "grid-four", count: 4 });
        remaining -= 4;
        idx += 4;
        lastLayout = "grid-four";
        continue;
      }

      // Default: pick layout matching count and orientation
      const take = remaining >= 4 ? 4 : remaining;
      const batch = group.photos.slice(idx, idx + take);
      const lt = chooseLayoutForGroup(batch, group.isPortrait, lastLayout, animVariant);
      const cap = Math.min(take, photosPerLayout(lt));
      rawUnits.push({ type: lt, count: cap });
      remaining -= cap;
      idx += cap;
      lastLayout = lt;
      animVariant++;
    }
  }

  // Step 3: Allocate frames
  const totalBase = rawUnits.reduce((s, u) => s + baseFramesPerUnit(u.type), 0) || 1;
  let unitStart = 0;
  let photoIdx = 0;
  const units: DisplayUnit[] = [];

  for (const raw of rawUnits) {
    const unitFrames = Math.max(75, Math.round(totalFrames * (baseFramesPerUnit(raw.type) / totalBase)));
    const adjusted = emphasis ? Math.round(unitFrames * 1.12) : unitFrames;

    units.push({
      type: raw.type,
      photos: photos.slice(photoIdx, photoIdx + raw.count),
      startFrame: unitStart,
      durationInFrames: adjusted,
      animationVariant: animVariant % 12,
    });

    photoIdx += raw.count;
    unitStart += adjusted;
    animVariant++;
  }

  // Trim if overallocated
  if (unitStart > totalFrames && units.length > 0) {
    const last = units[units.length - 1];
    last.durationInFrames = Math.max(75, last.durationInFrames - (unitStart - totalFrames));
  }

  return units;
}

function chooseLayoutForGroup(
  photos: Photo[],
  isPortraitGroup: boolean,
  prevLayout: LayoutType | undefined,
  variant: number,
): LayoutType {
  const count = photos.length;
  const mixed = hasMixedOrientation(photos);
  let pool: LayoutType[];

  if (mixed) {
    // Mixed orientation: prefer layouts that handle varied aspect ratios
    if (count === 1) pool = ["fullscreen", "photo-wall"];
    else if (count === 2) pool = ["split-two", "blend-two", "photo-wall"];
    else if (count === 3) pool = ["photo-wall", "asymmetric", "blend-two"];
    else pool = ["photo-wall", "split-two", "asymmetric"];
  } else if (isPortraitGroup) {
    // Portrait-only photos: prefer tall-cell layouts
    if (count === 1) pool = ["fullscreen", "photo-wall"];
    else if (count >= 3) pool = ["photo-wall", "asymmetric", "split-two"];
    else pool = ["split-two", "asymmetric", "blend-two", "photo-wall"];
  } else {
    // Landscape-only photos: prefer wide-cell layouts
    if (count === 1) pool = ["fullscreen", "blend-two"];
    else if (count === 2) pool = ["split-two", "blend-two", "fullscreen"];
    else if (count === 3) pool = ["three-layout", "photo-wall", "blend-two"];
    else pool = ["grid-four", "photo-wall", "three-layout"];
  }

  // CRITICAL: filter to only layouts that can fit the photo count
  const fitting = pool.filter((l) => photosPerLayout(l) === count || l === "photo-wall");
  const finalPool: LayoutType[] = fitting.length > 0 ? fitting : ["photo-wall"];

  // Avoid adjacent repeat
  const filtered = finalPool.filter((l) => l !== prevLayout);
  const selected = filtered[variant % filtered.length];
  return selected || finalPool[0];
}

export { OPENING_FRAMES, ENDING_FRAMES, TITLE_FRAMES, FPS };
