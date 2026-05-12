# Video Optimization Design

Date: 2026-05-11

## Problem

The Remotion wedding video has four issues to fix:
1. Duplicate photos at 2:39 — one frame shows three identical images
2. Black borders on most frames — only FullScreenPhoto has background fill
3. Mixed portrait/landscape in same frame looks messy
4. Limited transition effects — only basic spring animations

## Design

### 1. Fix Duplicate Photos

**Root cause**: `chooseLayoutForGroup` can return multi-photo layouts (e.g. `three-layout`, `blend-two`) for groups with fewer photos than the layout needs. Layout components then fall back with `photos[1] || photos[0]`, duplicating images.

**Fix**:
- In `chooseLayoutForGroup`: filter pools so a layout only appears when `photosPerLayout(l) <= count`. A 1-photo group gets only `fullscreen` or `photo-wall`.
- In all layout components: remove `|| photos[0]` fallbacks. If N photos provided, render exactly N cells.
- Enforce invariant: in `groupPhotosIntoUnits`, `rawUnits.count` always equals `photosPerLayout(rawUnits.type)`.

### 2. Eliminate Black Borders

**Current state**: All layouts except FullScreenPhoto use bare `objectFit: "contain"` with no background, producing black bars.

**Fix**: Add blurred background technique to every layout per-photo-cell:
- Each photo cell gets a blurred, darkened copy as background (`objectFit: "cover"`, `filter: blur(60px) brightness(0.35)`)
- Foreground uses `objectFit: "contain"` as before
- Applies to: SplitTwo, ThreeLayout, GridFour, AsymmetricCollage, PhotoWall, BlendTwo

### 3. Smarter Orientation Grouping

**Current state**: `groupPhotosIntoUnits` Step 1.5 deliberately merges alternating-orientation groups into mixed batches, creating visually disjointed frames.

**Fix** (keep merging, make smarter):
- When a group is mixed-orientation, `chooseLayoutForGroup` uses a dedicated pool: `["photo-wall", "blend-two", "split-two", "asymmetric"]` — no rigid-grid layouts
- `grid-four` and `three-layout` excluded for mixed groups since their fixed cell aspect ratios look bad with mixed content
- Blurred backgrounds from fix #2 handle remaining aspect ratio mismatch gracefully

### 4. Richer Transition Effects

**Fix** — add multiple new animation types:

**Enter animations** (added to all layouts, cycled via `animationVariant`):
- `zoom-blur`: scale from 1.3→1.0 with initial blur
- `slide-diagonal`: from top-left corner
- `flip-3D`: Y-axis rotation with perspective
- `stagger-reveal`: horizontal band wipe
- `elastic-bounce`: spring overshoot past 1.0

**Per-layout enter patterns**:
- SplitTwo: slide-from-sides, scale-stagger, vertical-blind
- ThreeLayout: cascade-diagonal, zoom-scatter, fade-wipe
- GridFour: spiral-reveal, checkerboard, scale-pop-sequence
- AsymmetricCollage: split-reveal, parallax-enter
- PhotoWall: scatter-assemble, drop-stack
- BlendTwo: radial-wipe, sliding-blind

**Exit animations**: Replace uniform fade-out with directional exits cycled by `animationVariant`:
- `slide-out-left`, `slide-out-right`, `zoom-out`, `fade-to-black`

**Ken Burns**: Add variable-speed pacing — faster movement in middle third of duration, slower at edges.

## Files Changed

| File | Changes |
|------|---------|
| `src/utils.ts` | Fix `groupPhotosIntoUnits` count invariant, fix `chooseLayoutForGroup` pool filtering, add mixed-orientation handling |
| `src/components/layouts/FullScreenPhoto.tsx` | Add new enter animation variants, enhanced exit, variable-speed Ken Burns |
| `src/components/layouts/SplitTwo.tsx` | Add blurred bg, remove fallback, per-layout enter patterns, directional exit |
| `src/components/layouts/ThreeLayout.tsx` | Add blurred bg, remove fallback, per-layout enter patterns, directional exit |
| `src/components/layouts/GridFour.tsx` | Add blurred bg, remove fallback, per-layout enter patterns, directional exit |
| `src/components/layouts/AsymmetricCollage.tsx` | Add blurred bg, remove fallback, per-layout enter patterns, directional exit |
| `src/components/layouts/PhotoWall.tsx` | Add blurred bg, enhanced enter/exit patterns |
| `src/components/layouts/BlendTwo.tsx` | Add blurred bg, enhanced transition patterns |

## Constraints

- Backward compatible: existing manifest JSON unchanged
- FPS remains 30, video dimensions 1920×1080
- Layout allocation timings unchanged
