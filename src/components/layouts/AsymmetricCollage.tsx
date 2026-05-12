import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { BlurredBg } from "../shared/BlurredBg";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const ASYM_ENTERS = ["split-reveal", "parallax-enter", "slide-stagger"];
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
