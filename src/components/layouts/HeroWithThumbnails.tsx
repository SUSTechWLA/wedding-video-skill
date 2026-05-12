import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

export const HeroWithThumbnails: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const heroEnter = spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 60 }, durationInFrames: 25 });

  const thumbCount = Math.min(photos.length - 1, 3);
  const thumbs: number[] = [];
  for (let i = 0; i < thumbCount; i++) {
    thumbs.push(spring({ frame: localFrame - 10 - i * 6, fps, config: { damping: 12, stiffness: 70 }, durationInFrames: 22 }));
  }

  const exitStart = durationInFrames - 25;
  const exit = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 25 })
    : 1;

  const orbitAngle = interpolate(localFrame, [0, durationInFrames], [0, 360], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const heroPhoto = photos[0];
  const thumbPhotos = photos.slice(1, thumbCount + 1);
  while (thumbPhotos.length < thumbCount) thumbPhotos.push(heroPhoto);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <div style={{ position: "absolute", inset: 0, opacity: exit }}>
        {/* Center hero — large, fills most of the screen */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: "70%", height: "60%",
          transform: `translate(-50%, -50%) scale(${0.8 + heroEnter * 0.2})`,
          opacity: heroEnter,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "transparent", zIndex: 1,
        }}>
          {heroPhoto && <Img src={staticFile(heroPhoto.path)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
        </div>

        {/* Thumbnails on TOP of the hero, larger */}
        {thumbPhotos.map((photo, i) => {
          const angle = (orbitAngle + i * (360 / thumbCount)) * (Math.PI / 180);
          // Keep thumbnails close to center
          const radius = 22 + i * 2;
          const tx = Math.cos(angle) * radius;
          const ty = Math.sin(angle) * radius;

          return (
            <div key={i} style={{
              position: "absolute",
              left: `calc(50% + ${tx}% - 70px)`,
              top: `calc(50% + ${ty}% - 55px)`,
              width: 140, height: 110,
              transform: `scale(${0.6 + thumbs[i] * 0.4})`,
              opacity: thumbs[i],
              borderRadius: 6, overflow: "hidden",
              boxShadow: "0 6px 24px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "transparent",
              zIndex: 10,
            }}>
              <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          );
        })}

        {/* Subtle vignette behind thumbnails */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 50%, transparent 35%, ${theme.bg}bb 70%)`,
        }} />
      </div>
    </AbsoluteFill>
  );
};
