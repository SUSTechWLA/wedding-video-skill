# Video Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix duplicate photos, eliminate black borders, improve orientation grouping, and add richer transitions to the Remotion wedding video.

**Architecture:** Modify existing files only — no new files. Add a reusable `BlurredBackground` component inline in each layout (keeps each layout self-contained). Fix `utils.ts` grouping invariants first (foundation), then `layoutHelper.ts` Ken Burns, then update each layout component to add bg fill and animations. The count invariant ensures layouts never receive wrong photo counts; the blurred bg + orientation fixes eliminate black bars and visual clutter.

**Tech Stack:** React 18 + Remotion 4.x + TypeScript

---

### Task 1: Fix layoutHelper.ts — add variable-speed Ken Burns and mixed-orientation helper

**Files:**
- Modify: `src/layoutHelper.ts`

- [ ] **Step 1: Replace `kenBurns` with variable-speed version**

Read `src/layoutHelper.ts`. Replace the existing `kenBurns` function (lines 31-47) with:

```typescript
/**
 * Ken Burns transform for contain mode with variable-speed pacing.
 * Photos move faster in the middle third, slower at edges for natural floating feel.
 */
export function kenBurns(
  photo: Photo,
  progress: number,
  intensity: number = 1,
): { scale: number; x: number; y: number } {
  // Variable-speed pacing: ease in/out the progress for smoother motion
  const eased = progress < 0.15
    ? (progress / 0.15) * (progress / 0.15) * 0.5
    : progress > 0.85
      ? 1 - ((1 - progress) / 0.15) * ((1 - progress) / 0.15) * 0.5
      : (progress - 0.15) / 0.7;
  const clampedEased = Math.max(0, Math.min(1, eased));

  const portrait = photo.height > photo.width;
  if (portrait) {
    const scale = 1 + intensity * 0.05 * (1 + Math.sin(clampedEased * Math.PI) * 0.5);
    const x = Math.sin(clampedEased * Math.PI * 0.6) * 10 * intensity;
    const y = (clampedEased - 0.5) * 25 * intensity;
    return { scale, x, y };
  }
  const scale = 1 + intensity * 0.04 * clampedEased;
  const x = (clampedEased - 0.5) * 14 * intensity;
  const y = Math.sin(clampedEased * Math.PI * 0.4) * 8 * intensity;
  return { scale, x, y };
}
```

- [ ] **Step 2: Add `hasMixedOrientation` helper**

Append after the `photoWallLayout` function:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to layoutHelper.ts

- [ ] **Step 4: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/layoutHelper.ts && git commit -m "feat: add variable-speed Ken Burns and mixed-orientation helper

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Fix utils.ts — count invariant, pool filtering, mixed orientation

**Files:**
- Modify: `src/utils.ts`

- [ ] **Step 1: Fix `chooseLayoutForGroup` to filter pools by photo count**

Read `src/utils.ts`. Replace the `chooseLayoutForGroup` function (lines 272-303) with:

```typescript
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
  const finalPool = fitting.length > 0 ? fitting : ["photo-wall"];

  // Avoid adjacent repeat
  const filtered = finalPool.filter((l) => l !== prevLayout);
  const selected = filtered[variant % filtered.length];
  return selected || finalPool[0];
}
```

Add the import for `hasMixedOrientation` at the top of the file (line 8):
```typescript
import { isPortrait, isLandscape, hasMixedOrientation } from "./layoutHelper";
```

- [ ] **Step 2: Fix `groupPhotosIntoUnits` to enforce count === photosPerLayout invariant**

Replace the portrait-3 special case (lines 212-218) with:

```typescript
      // For portrait groups of 3: use a 3-photo portrait-friendly layout
      if (group.isPortrait && remaining === 3) {
        const lt = chooseLayoutForGroup(group.photos.slice(idx, idx + 3), true, lastLayout, animVariant);
        const cap = photosPerLayout(lt);
        rawUnits.push({ type: lt, count: cap });
        remaining -= cap;
        idx += cap;
        lastLayout = lt;
        animVariant++;
        continue;
      }
```

Replace the landscape-4 case (lines 220-226) with:

```typescript
      // For landscape groups of >=4: use grid-four
      if (!group.isPortrait && remaining >= 4 && !hasMixedOrientation(group.photos.slice(idx, idx + 4))) {
        rawUnits.push({ type: "grid-four", count: 4 });
        remaining -= 4;
        idx += 4;
        lastLayout = "grid-four";
        animVariant++;
        continue;
      }
```

Replace the default case (lines 228-237) with:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors from utils.ts

- [ ] **Step 4: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/utils.ts && git commit -m "fix: enforce layout photo count invariant and mixed-orientation handling

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Update FullScreenPhoto — new enter animations, enhanced exit, variable-speed KB

**Files:**
- Modify: `src/components/layouts/FullScreenPhoto.tsx`

- [ ] **Step 1: Expand enter animations and add exit animations**

Read `src/components/layouts/FullScreenPhoto.tsx`. Replace the `ENTER_ANIMS` array (line 11-13) and the entire component body with:

```typescript
const ENTER_ANIMS = [
  "fade-in", "slide-left", "slide-right", "slide-up",
  "scale-bounce", "rotate-pop", "circle-reveal", "shutter-flip",
  "zoom-blur", "slide-diagonal", "flip-3d", "elastic-bounce",
];

const EXIT_ANIMS = [
  "fade-out", "slide-out-left", "slide-out-right", "zoom-out",
];
```

Replace the enter/exit calculation block (lines 23-46) with:

```typescript
  const enterType = ENTER_ANIMS[animationVariant % ENTER_ANIMS.length];
  const exitType = EXIT_ANIMS[animationVariant % EXIT_ANIMS.length];
  const enterProgress = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 25 });

  const exitStart = Math.max(0, durationInFrames - 28);
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;

  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const kb = kenBurns(photo, progress, emphasis ? 1.3 : 0.8);

  // Enter animation transforms
  let enterTransform = "";
  let enterOpacity = enterProgress;
  let enterClip: string | undefined;
  let enterFilter = "";

  switch (enterType) {
    case "slide-left": enterTransform = `translateX(${(1 - enterProgress) * -100}px)`; break;
    case "slide-right": enterTransform = `translateX(${(1 - enterProgress) * 100}px)`; break;
    case "slide-up": enterTransform = `translateY(${(1 - enterProgress) * 50}px)`; break;
    case "scale-bounce": enterTransform = `scale(${enterProgress})`; break;
    case "rotate-pop": enterTransform = `rotate(${(1 - enterProgress) * -4}deg) scale(${0.88 + enterProgress * 0.12})`; break;
    case "circle-reveal": enterClip = `circle(${enterProgress * 100}% at center)`; break;
    case "zoom-blur": enterTransform = `scale(${0.7 + enterProgress * 0.3})`; enterFilter = `blur(${(1 - enterProgress) * 12}px)`; break;
    case "slide-diagonal": enterTransform = `translate(${(1 - enterProgress) * -60}px, ${(1 - enterProgress) * -40}px)`; break;
    case "flip-3d": enterTransform = `perspective(1200px) rotateY(${(1 - enterProgress) * 90}deg)`; break;
    case "elastic-bounce": {
      const overshoot = spring({ frame: localFrame, fps, config: { damping: 6, stiffness: 120 }, durationInFrames: 28 });
      enterTransform = `scale(${overshoot})`;
      break;
    }
    default: enterOpacity = enterProgress;
  }

  // Exit animation transforms
  let exitTransform = "";
  const exitFactor = 1 - exitProgress;
  switch (exitType) {
    case "slide-out-left": exitTransform = `translateX(${exitFactor * -100}px)`; break;
    case "slide-out-right": exitTransform = `translateX(${exitFactor * 100}px)`; break;
    case "zoom-out": exitTransform = `scale(${1 - exitFactor * 0.4})`; break;
  }

  const opacity = Math.min(enterOpacity, exitProgress);
  const transform = [
    enterTransform,
    exitTransform,
    `translateX(${kb.x}px)`,
    `translateY(${kb.y}px)`,
    `scale(${kb.scale})`,
  ].filter(Boolean).join(" ");
```

Replace the sharp foreground `<Img>` style (line 67-68) with:

```typescript
              style={{ width: "100%", height: "100%", objectFit: "contain", opacity, transform, filter: enterFilter || undefined }}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors from FullScreenPhoto.tsx

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/FullScreenPhoto.tsx && git commit -m "feat: add richer enter/exit animations to FullScreenPhoto

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Update SplitTwo — blurred bg, remove fallback, enter/exit patterns

**Files:**
- Modify: `src/components/layouts/SplitTwo.tsx`

- [ ] **Step 1: Rewrite SplitTwo with blurred background, enhanced animations, no fallback**

Read `src/components/layouts/SplitTwo.tsx`. Replace the entire file content with:

```typescript
import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { isPortrait } from "../../layoutHelper";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const SPLIT_ENTERS = ["slide-from-sides", "scale-stagger", "vertical-blind", "fade-cascade"];

function calcSplitRatio(a: Photo, b: Photo, isHorizontal: boolean): number {
  const arA = a.width / a.height;
  const arB = b.width / b.height;
  if (isHorizontal) {
    const r = arA / (arA + arB);
    return Math.max(0.3, Math.min(0.7, r));
  } else {
    const r = arB / (arA + arB);
    return Math.max(0.3, Math.min(0.7, r));
  }
}

const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const SplitTwo: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = SPLIT_ENTERS[animationVariant % SPLIT_ENTERS.length];

  const photo1 = photos[0];
  const photo2 = photos.length >= 2 ? photos[1] : null;

  // If only 1 photo, render single full cell (no duplication)
  const isSingle = !photo2;

  const bothPortrait = photo2 ? isPortrait(photo1) && isPortrait(photo2) : isPortrait(photo1);
  const bothLandscape = photo2 ? !isPortrait(photo1) && !isPortrait(photo2) : !isPortrait(photo1);
  const isHorizontal = bothPortrait || (!bothLandscape && !bothPortrait) || isSingle;

  const splitRatio = photo2 ? calcSplitRatio(photo1, photo2, isHorizontal) : 0.5;
  const firstPct = isSingle ? "100%" : `${(splitRatio * 100).toFixed(1)}%`;
  const secondPct = isSingle ? "0%" : `${((1 - splitRatio) * 100).toFixed(1)}%`;

  const enter = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 70 }, durationInFrames: 20 });
  const exitStart = durationInFrames - 28;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;
  const opacity = Math.min(enter, exitProgress);

  const secondDelay = spring({ frame: localFrame - 8, fps, config: { damping: 14, stiffness: 70 }, durationInFrames: 20 });

  // Exit direction
  const exitDir = animationVariant % 4;
  const exitTransforms = [
    `translateX(${(1 - exitProgress) * -100}px)`,
    `translateX(${(1 - exitProgress) * 100}px)`,
    `translateY(${(1 - exitProgress) * -100}px)`,
    `scale(${0.6 + exitProgress * 0.4})`,
  ];

  const cellStyle = (delay: number, index: number): React.CSSProperties => {
    let cellTransform = "";
    switch (enterType) {
      case "slide-from-sides":
        cellTransform = `translateX(${(1 - delay) * (index === 0 ? -30 : 30)}px)`;
        break;
      case "scale-stagger":
        cellTransform = `scale(${0.85 + delay * 0.15})`;
        break;
      case "vertical-blind":
        cellTransform = `scaleY(${delay})`;
        break;
      case "fade-cascade":
        cellTransform = `translateY(${(1 - delay) * 20}px)`;
        break;
    }
    return {
      overflow: "hidden", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "transparent", opacity: delay,
      transform: `${cellTransform} ${exitTransforms[exitDir]}`,
    };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        width: "100%", height: "100%", opacity,
        padding: 8, gap: 4,
      }}>
        <div style={{
          ...cellStyle(enter, 0),
          [isHorizontal ? "width" : "height"]: firstPct,
          [isHorizontal ? "height" : "width"]: "100%",
        }}>
          <BlurredBg photo={photo1} opacity={opacity} />
          <Img src={staticFile(photo1.path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
        </div>
        {photo2 && (
          <>
            {isHorizontal
              ? <div style={{ width: 2, alignSelf: "stretch", backgroundColor: theme.accentDim, opacity: enter * 0.4, flexShrink: 0 }} />
              : <div style={{ height: 2, alignSelf: "stretch", backgroundColor: theme.accentDim, opacity: enter * 0.4, flexShrink: 0 }} />
            }
            <div style={{
              ...cellStyle(secondDelay, 1),
              [isHorizontal ? "width" : "height"]: secondPct,
              [isHorizontal ? "height" : "width"]: "100%",
            }}>
              <BlurredBg photo={photo2} opacity={opacity} />
              <Img src={staticFile(photo2.path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors from SplitTwo.tsx

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/SplitTwo.tsx && git commit -m "feat: add blurred bg, enhanced enter/exit to SplitTwo

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Update ThreeLayout — blurred bg, remove fallback, enter/exit patterns

**Files:**
- Modify: `src/components/layouts/ThreeLayout.tsx`

- [ ] **Step 1: Rewrite ThreeLayout**

Read `src/components/layouts/ThreeLayout.tsx`. Replace the entire file with:

```typescript
import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const THREEL_ENTERS = ["cascade-diagonal", "zoom-scatter", "fade-wipe"];

function calcTopPct(photos: Photo[]): number {
  const topAR = photos[0] ? photos[0].width / photos[0].height : 1.5;
  if (topAR >= 1.5) return 55;
  if (topAR >= 1.1) return 48;
  return 42;
}

const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const ThreeLayout: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = THREEL_ENTERS[animationVariant % THREEL_ENTERS.length];
  const usable = photos.slice(0, 3);
  // Pad to 3 for single/double photo cases (render empty cells)
  const cells: (Photo | null)[] = [usable[0] || null, usable[1] || null, usable[2] || null];
  const hasBottom = cells[1] !== null;

  const delayFrames = enterType === "cascade-diagonal" ? [0, 8, 14] :
    enterType === "zoom-scatter" ? [0, 6, 12] : [0, 10, 18];
  const ent = delayFrames.map((d, i) => {
    if (!cells[i]) return 0;
    return spring({ frame: localFrame - d, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 22 });
  });

  const exitStart = durationInFrames - 28;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;

  const exitDir = animationVariant % 3;
  const exitBase = 1 - exitProgress;
  const exitTransforms = [
    `translateX(${exitBase * -100}px)`,
    `translateX(${exitBase * 100}px)`,
    `scale(${1 - exitBase * 0.5})`,
  ];

  const topPct = calcTopPct(photos);
  const bottomARs = cells[1] && cells[2]
    ? (() => {
        const p1 = cells[1]!, p2 = cells[2]!;
        const ar1 = p1.width / p1.height;
        const ar2 = p2.width / p2.height;
        const r = ar1 / (ar1 + ar2);
        const clamped = Math.max(0.33, Math.min(0.67, r));
        return [clamped * 100, (1 - clamped) * 100];
      })()
    : [50, 50];

  const getEnterTransform = (i: number, delay: number): string => {
    switch (enterType) {
      case "cascade-diagonal": return `translate(${(1 - delay) * -30}px, ${(1 - delay) * -20}px)`;
      case "zoom-scatter": return `scale(${0.8 + delay * 0.2}) rotate(${(1 - delay) * 3}deg)`;
      case "fade-wipe": return `translateX(${(1 - delay) * (i === 1 ? -20 : i === 2 ? 20 : -30)}px)`;
      default: return "";
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", opacity: exitProgress, padding: 8, gap: 4 }}>
        <div style={{
          flex: `0 0 ${topPct}%`, overflow: "hidden", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "transparent", opacity: ent[0],
          transform: `${getEnterTransform(0, ent[0])} ${exitTransforms[exitDir]}`,
        }}>
          {cells[0] && (
            <>
              <BlurredBg photo={cells[0]} opacity={Math.min(ent[0], exitProgress)} />
              <Img src={staticFile(cells[0].path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
            </>
          )}
        </div>
        {hasBottom && (
          <>
            <div style={{ height: 2, background: theme.accentDim, opacity: exitProgress * 0.3, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "row", gap: 4 }}>
              {cells[1] && (
                <>
                  <div style={{
                    flex: `0 0 ${bottomARs[0].toFixed(1)}%`, overflow: "hidden", position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "transparent", opacity: ent[1],
                    transform: `${getEnterTransform(1, ent[1])} ${exitTransforms[exitDir]}`,
                  }}>
                    <BlurredBg photo={cells[1]} opacity={Math.min(ent[1], exitProgress)} />
                    <Img src={staticFile(cells[1].path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
                  </div>
                  {bottomARs[0] < 99 && (
                    <div style={{ width: 2, alignSelf: "stretch", background: theme.accentDim, opacity: exitProgress * 0.3, flexShrink: 0 }} />
                  )}
                </>
              )}
              {cells[2] && (
                <div style={{
                  flex: 1, overflow: "hidden", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "transparent", opacity: ent[2],
                  transform: `${getEnterTransform(2, ent[2])} ${exitTransforms[exitDir]}`,
                }}>
                  <BlurredBg photo={cells[2]} opacity={Math.min(ent[2], exitProgress)} />
                  <Img src={staticFile(cells[2].path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/ThreeLayout.tsx && git commit -m "feat: add blurred bg, enhanced enter/exit to ThreeLayout

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Update GridFour — blurred bg, enhanced enter/exit

**Files:**
- Modify: `src/components/layouts/GridFour.tsx`

- [ ] **Step 1: Rewrite GridFour**

Read `src/components/layouts/GridFour.tsx`. Replace the entire file with:

```typescript
import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const GRID_ENTERS = ["spiral-reveal", "checkerboard", "scale-pop-sequence"];

const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const GridFour: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = GRID_ENTERS[animationVariant % GRID_ENTERS.length];

  // Spiral order: top-left, top-right, bottom-right, bottom-left
  // Checkerboard: top-left+btm-right first, then others
  // Scale-pop: top-left, top-right, bottom-left, bottom-right
  const delays: Record<string, number[]> = {
    "spiral-reveal": [0, 8, 16, 22],
    "checkerboard": [0, 0, 12, 12],
    "scale-pop-sequence": [0, 6, 12, 18],
  };
  const del = delays[enterType] || [0, 6, 12, 18];
  const spr = del.map(d => spring({ frame: localFrame - d, fps, config: { damping: 12, stiffness: 70 }, durationInFrames: 22 }));

  const exitStart = durationInFrames - 28;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;

  const exitDir = animationVariant % 3;
  const exitFactor = 1 - exitProgress;
  const exitTransforms = [
    `scale(${1 - exitFactor * 0.3})`,
    `translateY(${exitFactor * 100}px)`,
    `rotate(${exitFactor * 8}deg) scale(${1 - exitFactor * 0.3})`,
  ];

  const imgs: (Photo | null)[] = [photos[0] || null, photos[1] || null, photos[2] || null, photos[3] || null];
  const cellCount = imgs.filter(Boolean).length;
  const cols = cellCount <= 2 ? 2 : 2;
  const rows = cellCount <= 2 ? Math.ceil(cellCount / 2) : 2;

  // Only show the cells that have photos
  const visibleIndices = imgs.map((img, i) => img !== null ? i : -1).filter(i => i >= 0);

  const getEnterTransform = (i: number, s: number): string => {
    switch (enterType) {
      case "spiral-reveal": return `scale(${0.8 + s * 0.2}) rotate(${(1 - s) * 6}deg)`;
      case "checkerboard": return `scale(${0.7 + s * 0.3})`;
      case "scale-pop-sequence": return `translateY(${(1 - s) * 30}px) scale(${0.85 + s * 0.15})`;
      default: return `scale(${0.85 + s * 0.15})`;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 2, width: "100%", height: "100%",
        opacity: exitProgress, backgroundColor: theme.bg,
      }}>
        {imgs.map((photo, i) => (
          photo ? (
            <div key={i} style={{
              overflow: "hidden", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "transparent", opacity: spr[i],
              transform: `${getEnterTransform(i, spr[i])} ${exitTransforms[exitDir]}`,
            }}>
              <BlurredBg photo={photo} opacity={Math.min(spr[i], exitProgress)} />
              <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
            </div>
          ) : null
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/GridFour.tsx && git commit -m "feat: add blurred bg, enhanced enter/exit to GridFour

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Update AsymmetricCollage — blurred bg, enhanced enter/exit

**Files:**
- Modify: `src/components/layouts/AsymmetricCollage.tsx`

- [ ] **Step 1: Rewrite AsymmetricCollage**

Read `src/components/layouts/AsymmetricCollage.tsx`. Replace the entire file with:

```typescript
import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const ASYM_ENTERS = ["split-reveal", "parallax-enter", "slide-stagger"];

const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const AsymmetricCollage: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = ASYM_ENTERS[animationVariant % ASYM_ENTERS.length];
  const usable = photos.slice(0, 3);
  const cells: (Photo | null)[] = [usable[0] || null, usable[1] || null, usable[2] || null];

  const delays = enterType === "parallax-enter" ? [0, 10, 18] :
    enterType === "slide-stagger" ? [0, 8, 16] : [0, 8, 14];
  const ent = delays.map((d, i) => {
    if (!cells[i]) return 0;
    return spring({ frame: localFrame - d, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 22 });
  });

  const exitStart = durationInFrames - 28;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;

  const exitDir = animationVariant % 3;
  const exitFactor = 1 - exitProgress;
  const exitTransforms = [
    `translateX(${exitFactor * -100}px)`,
    `translateY(${exitFactor * -100}px)`,
    `scale(${1 - exitFactor * 0.4})`,
  ];

  const getEnterTransform = (i: number, delay: number): string => {
    switch (enterType) {
      case "split-reveal": return i === 0 ? `translateX(${(1 - delay) * -30}px)` : `translateY(${(1 - delay) * (i === 1 ? -20 : 20)}px)`;
      case "parallax-enter": return `translate(${(1 - delay) * (i - 1) * 15}px, ${(1 - delay) * (i - 1) * 10}px) scale(${0.9 + delay * 0.1})`;
      case "slide-stagger": return `translateX(${(1 - delay) * (i === 0 ? -40 : i === 1 ? -20 : 20)}px)`;
      default: return "";
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%", opacity: exitProgress, gap: 6, padding: 8 }}>
        {/* Left panel */}
        <div style={{
          flex: 1, overflow: "hidden", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "transparent", borderRadius: 6,
          opacity: ent[0], transform: `${getEnterTransform(0, ent[0])} ${exitTransforms[exitDir]}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>
          {cells[0] && (
            <>
              <BlurredBg photo={cells[0]} opacity={Math.min(ent[0], exitProgress)} />
              <Img src={staticFile(cells[0].path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
            </>
          )}
        </div>
        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{
            flex: 1, overflow: "hidden", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "transparent", borderRadius: 6,
            opacity: ent[1], transform: `${getEnterTransform(1, ent[1])} ${exitTransforms[exitDir]}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
            {cells[1] && (
              <>
                <BlurredBg photo={cells[1]} opacity={Math.min(ent[1], exitProgress)} />
                <Img src={staticFile(cells[1].path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
              </>
            )}
          </div>
          <div style={{
            flex: 1, overflow: "hidden", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "transparent", borderRadius: 6,
            opacity: ent[2], transform: `${getEnterTransform(2, ent[2])} ${exitTransforms[exitDir]}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
            {cells[2] && (
              <>
                <BlurredBg photo={cells[2]} opacity={Math.min(ent[2], exitProgress)} />
                <Img src={staticFile(cells[2].path)} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} />
              </>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/AsymmetricCollage.tsx && git commit -m "feat: add blurred bg, enhanced enter/exit to AsymmetricCollage

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Update PhotoWall — blurred bg, enhanced enter/exit

**Files:**
- Modify: `src/components/layouts/PhotoWall.tsx`

- [ ] **Step 1: Rewrite PhotoWall**

Read `src/components/layouts/PhotoWall.tsx`. Replace the entire file with:

```typescript
import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { photoWallLayout } from "../../layoutHelper";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const WALL_ENTERS = ["scatter-assemble", "drop-stack", "fade-float"];

const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const PhotoWall: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = WALL_ENTERS[animationVariant % WALL_ENTERS.length];
  const positions = photoWallLayout(photos);

  const enterProgress = spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 60 }, durationInFrames: 30 });
  const exitStart = durationInFrames - 30;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 30 })
    : 1;

  const driftX = interpolate(localFrame, [0, durationInFrames], [0, 4], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const driftY = interpolate(localFrame, [0, durationInFrames], [0, -3], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Exit effect
  const exitDir = animationVariant % 3;
  const exitFactor = 1 - exitProgress;
  const exitTransform = [
    `translateX(${exitFactor * -60}px)`,
    `translateY(${exitFactor * 60}px)`,
    `scale(${1 - exitFactor * 0.5})`,
  ][exitDir];

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: "-5%",
        transform: `translate(${driftX}px, ${driftY}px) ${exitTransform}`,
        opacity: Math.min(enterProgress, exitProgress),
      }}>
        {positions.map((pos, i) => {
          const photo = photos[i];
          if (!photo) return null;

          const staggerDelay = enterType === "drop-stack" ? i * 8 :
            enterType === "scatter-assemble" ? i * 6 : i * 5;
          const enter = spring({
            frame: localFrame - staggerDelay, fps,
            config: { damping: 10, stiffness: 50 },
            durationInFrames: 32,
          });

          const floatY = Math.sin((localFrame + i * 35) / 22) * 5 * enter;
          const floatRot = Math.sin((localFrame + i * 25) / 28) * 1.5 * enter;

          // Enter-specific transforms
          let enterTransform = "";
          switch (enterType) {
            case "scatter-assemble":
              enterTransform = `translate(${(1 - enter) * (i % 2 === 0 ? -60 : 60)}px, ${(1 - enter) * ((i < 2 ? 1 : -1) * 40)}px)`;
              break;
            case "drop-stack":
              enterTransform = `translateY(${(1 - enter) * -80}px)`;
              break;
            case "fade-float":
            default:
              enterTransform = `scale(${0.7 + enter * 0.3})`;
              break;
          }

          return (
            <div key={i} style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.w}%`,
              height: `${pos.h}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rot + floatRot}deg) ${enterTransform} translateY(${floatY}px)`,
              opacity: enter * exitProgress,
              boxShadow: "4px 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}>
              <BlurredBg photo={photo} opacity={enter * exitProgress} />
              <Img
                src={staticFile(photo.path)}
                style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/PhotoWall.tsx && git commit -m "feat: add blurred bg, enhanced enter/exit to PhotoWall

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: Update BlendTwo — blurred bg, enhanced transition patterns

**Files:**
- Modify: `src/components/layouts/BlendTwo.tsx`

- [ ] **Step 1: Rewrite BlendTwo**

Read `src/components/layouts/BlendTwo.tsx`. Replace the entire file with:

```typescript
import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const BLEND_STYLES = ["cross-fade", "radial-wipe", "sliding-blind", "wipe-left"];

const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const BlendTwo: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const style = BLEND_STYLES[animationVariant % BLEND_STYLES.length];

  const enter = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 70 }, durationInFrames: 25 });

  const exitStart = durationInFrames - 28;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;

  // Directional exit
  const exitDir = animationVariant % 3;
  const exitFactor = 1 - exitProgress;
  const exitTransforms = [
    `translateX(${exitFactor * -100}px)`,
    `translateY(${exitFactor * -100}px)`,
    `scale(${1 - exitFactor * 0.4})`,
  ];

  const opacity = Math.min(enter, exitProgress);
  const blendProgress = interpolate(localFrame, [5, durationInFrames - 5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const photo1 = photos[0];
  const photo2 = photos.length >= 2 ? photos[1] : null;

  const containerStyle: React.CSSProperties = {
    position: "absolute", inset: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  };
  const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 };

  if (!photo2) {
    // Single photo: render with blurred bg, no blend
    return (
      <AbsoluteFill style={{ backgroundColor: theme.bg, opacity, transform: exitTransforms[exitDir] }}>
        <div style={{ ...containerStyle }}>
          <BlurredBg photo={photo1} opacity={opacity} />
          <Img src={staticFile(photo1.path)} style={imgStyle} />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, opacity, transform: exitTransforms[exitDir] }}>
      {style === "wipe-left" ? (
        <>
          <div style={{ ...containerStyle }}>
            <BlurredBg photo={photo2} opacity={opacity} />
            <Img src={staticFile(photo2.path)} style={imgStyle} />
          </div>
          <div style={{ ...containerStyle, clipPath: `inset(0 ${100 - blendProgress * 100}% 0 0)` }}>
            <BlurredBg photo={photo1} opacity={opacity} />
            <Img src={staticFile(photo1.path)} style={imgStyle} />
          </div>
          <div style={{ position: "absolute", left: `${blendProgress * 100}%`, top: 0, width: 2, height: "100%", background: theme.accent, boxShadow: `0 0 16px ${theme.accent}`, opacity: 0.7 }} />
        </>
      ) : style === "radial-wipe" ? (
        <>
          <div style={{ ...containerStyle }}>
            <BlurredBg photo={photo2} opacity={opacity} />
            <Img src={staticFile(photo2.path)} style={imgStyle} />
          </div>
          <div style={{ ...containerStyle, clipPath: `circle(${blendProgress * 150}% at center)` }}>
            <BlurredBg photo={photo1} opacity={opacity} />
            <Img src={staticFile(photo1.path)} style={imgStyle} />
          </div>
        </>
      ) : style === "sliding-blind" ? (
        <>
          <div style={{ ...containerStyle }}>
            <BlurredBg photo={photo2} opacity={opacity} />
            <Img src={staticFile(photo2.path)} style={imgStyle} />
          </div>
          <div style={{ ...containerStyle, clipPath: `inset(0 0 ${100 - blendProgress * 100}% 0)` }}>
            <BlurredBg photo={photo1} opacity={opacity} />
            <Img src={staticFile(photo1.path)} style={imgStyle} />
          </div>
        </>
      ) : (
        // cross-fade
        <>
          <div style={{ ...containerStyle }}>
            <BlurredBg photo={photo1} opacity={opacity * (1 - blendProgress * 0.7)} />
            <Img src={staticFile(photo1.path)} style={{ ...imgStyle, opacity: 1 - blendProgress * 0.7 }} />
          </div>
          <div style={{ ...containerStyle }}>
            <BlurredBg photo={photo2} opacity={opacity * (0.2 + blendProgress * 0.8)} />
            <Img src={staticFile(photo2.path)} style={{ ...imgStyle, opacity: 0.2 + blendProgress * 0.8 }} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
cd /Users/wanglian/Projects && git add video/wedding/src/components/layouts/BlendTwo.tsx && git commit -m "feat: add blurred bg, enhanced transition patterns to BlendTwo

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Full TypeScript type check and manual verification

**Files:** All changed files

- [ ] **Step 1: Run full TypeScript check**

Run: `cd /Users/wanglian/Projects/video/wedding && npx tsc --noEmit 2>&1`
Expected: No errors

- [ ] **Step 2: Start Remotion preview and spot-check**

Run: `cd /Users/wanglian/Projects/video/wedding && npx remotion studio`
Manually verify:
- No duplicate photos in any frame (especially around the 2:39 mark)
- No black borders in any layout
- Mixed-orientation frames only appear in photo-wall or blend-two layouts
- Enter/exit animations play smoothly across different categories

- [ ] **Step 3: Final commit if any TypeScript fixes were needed**

(Only if changes were needed in Step 1)
```bash
cd /Users/wanglian/Projects && git add -A && git commit -m "chore: final TypeScript fixes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
