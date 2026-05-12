import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { BlurredBg } from "../shared/BlurredBg";

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
export const ThreeLayout: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = THREEL_ENTERS[animationVariant % THREEL_ENTERS.length];
  const usable = photos.slice(0, 3);
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
