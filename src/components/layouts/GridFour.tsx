import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { BlurredBg } from "../shared/BlurredBg";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const GRID_ENTERS = ["spiral-reveal", "checkerboard", "scale-pop-sequence"];
export const GridFour: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = GRID_ENTERS[animationVariant % GRID_ENTERS.length];

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
        display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr",
        gap: 2, width: "100%", height: "100%", opacity: exitProgress, backgroundColor: theme.bg,
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
