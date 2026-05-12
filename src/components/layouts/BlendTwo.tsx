import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { BlurredBg } from "../shared/BlurredBg";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const BLEND_STYLES = ["cross-fade", "radial-wipe", "sliding-blind", "wipe-left"];
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
