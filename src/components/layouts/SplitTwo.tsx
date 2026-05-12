import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { BlurredBg } from "../shared/BlurredBg";
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
