import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../types";

interface Props {
  date: string;
  firstPhoto: Photo | null;
  theme: ThemeColors;
}

export const OpeningTitle: React.FC<Props> = ({ date, firstPhoto, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = 300; // 10s

  // Title animation sequence
  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 70 },
    durationInFrames: 40,
    delay: 15,
  });

  const dateEnter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 30,
    delay: 30,
  });

  // Background photo fades in slowly
  const bgOpacity = interpolate(frame, [30, 120], [0, 0.25], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Ken Burns on background
  const bgScale = interpolate(frame, [0, totalFrames], [1, 1.15], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Exit: fade out in last 30 frames
  const exitStart = totalFrames - 30;
  const exit =
    frame > exitStart
      ? 1 -
        spring({
          frame: frame - exitStart,
          fps,
          config: { damping: 20, stiffness: 100 },
          durationInFrames: 30,
        })
      : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background photo */}
      {firstPhoto && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: bgOpacity * exit,
            transform: `scale(${bgScale})`,
          }}
        >
          <Img
            src={staticFile(firstPhoto.path)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(8px) brightness(0.4)",
            }}
          />
        </div>
      )}

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
          opacity: exit,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: exit,
        }}
      >
        <h1
          style={{
            fontSize: 80,
            fontWeight: 700,
            fontFamily: '"STKaiti", "KaiTi SC", "Noto Serif SC", "SimKai", serif',
            color: theme.text,
            textShadow: `0 0 40px ${theme.glow}, 0 2px 8px rgba(0,0,0,0.5)`,
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 30}px) scale(${0.9 + titleEnter * 0.1})`,
            letterSpacing: 12,
            margin: 0,
          }}
        >
          我们的这些年
        </h1>

        {/* Divider */}
        <div
          style={{
            width: `${titleEnter * 120}px`,
            height: 2,
            background: theme.accent,
            margin: "30px 0",
            opacity: titleEnter,
            boxShadow: `0 0 10px ${theme.accent}`,
          }}
        />

        {/* Date */}
        <p
          style={{
            fontSize: 32,
            fontWeight: 300,
            fontFamily: '"STKaiti", "KaiTi SC", "Noto Serif SC", serif',
            color: theme.muted,
            opacity: dateEnter,
            transform: `translateY(${(1 - dateEnter) * 15}px)`,
            letterSpacing: 8,
            margin: 0,
          }}
        >
          {date}
        </p>
      </div>
    </AbsoluteFill>
  );
};
