import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { ThemeColors } from "../types";

interface Props {
  names: string;
  date: string;
  thanks: string;
  summary: string[];
  theme: ThemeColors;
}

export const EndingCredits: React.FC<Props> = ({ names, date, thanks, summary, theme }) => {
  const frame = useCurrentFrame();
  const totalFrames = 360; // 12s

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const scrollY = interpolate(frame, [20, totalFrames - 40], [40, -30], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const fadeOut = interpolate(frame, [totalFrames - 45, totalFrames], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  const heartScale = interpolate(frame, [60, 90, 120, 150, 180], [1, 1.08, 1, 1.08, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Summary text fades in after the main credits
  const summaryOpacity = interpolate(frame, [180, 210], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${theme.glow} 0%, transparent 60%)`,
        opacity: opacity * 0.5,
      }} />

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity, transform: `translateY(${scrollY}px)`,
      }}>
        {/* Heart */}
        <div style={{
          fontSize: 48, transform: `scale(${heartScale})`,
          marginBottom: 40, color: theme.accent,
          textShadow: `0 0 30px ${theme.accentDim}`,
        }}>♥</div>

        {/* Names */}
        <h2 style={{
          fontSize: 56, fontWeight: 700,
          fontFamily: '"STKaiti", "KaiTi SC", "Noto Serif SC", "SimKai", serif',
          color: theme.text, textShadow: `0 0 20px ${theme.glow}`,
          letterSpacing: 10, margin: "0 0 20px 0",
        }}>{names}</h2>

        {/* Date */}
        <p style={{
          fontSize: 28, fontWeight: 300,
          fontFamily: '"STKaiti", "KaiTi SC", "Noto Serif SC", serif',
          color: theme.muted, letterSpacing: 6, margin: "0 0 50px 0",
        }}>{date}</p>

        {/* Divider */}
        <div style={{ width: 100, height: 1, background: theme.accent, margin: "0 0 50px 0", opacity: 0.6 }} />

        {/* Thanks */}
        <p style={{
          fontSize: 24, fontWeight: 300,
          fontFamily: '"STKaiti", "KaiTi SC", "Noto Serif SC", serif',
          color: theme.muted, letterSpacing: 4, margin: "0 0 60px 0",
        }}>{thanks}</p>

        {/* Summary text */}
        <div style={{ opacity: summaryOpacity, textAlign: "center", maxWidth: "80%" }}>
          {summary.map((line, i) => {
            const isLast = i === summary.length - 1;
            return (
              <p key={i} style={{
                fontSize: isLast ? 26 : 22,
                fontWeight: isLast ? 700 : 400,
                fontFamily: '"STKaiti", "KaiTi SC", "Noto Serif SC", "SimKai", serif',
                color: isLast ? undefined : theme.muted,
                background: isLast ? theme.titleGradient : undefined,
                WebkitBackgroundClip: isLast ? "text" : undefined,
                WebkitTextFillColor: isLast ? "transparent" : undefined,
                backgroundClip: isLast ? "text" : undefined,
                letterSpacing: isLast ? 6 : 4,
                lineHeight: 1.8,
                margin: isLast ? "20px 0 0 0" : "0 0 16px 0",
              }}>
                {line}
              </p>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
