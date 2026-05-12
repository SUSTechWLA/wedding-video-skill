import React from "react";
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { ThemeColors } from "../types";

interface Props {
  title: string;
  startFrame: number;
  theme: ThemeColors;
  emphasis: boolean;
}

export const ChapterTitle: React.FC<Props> = ({ title, startFrame, theme, emphasis }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  const totalFrames = 120; // 4 seconds

  // Enter: fade in + slight scale up
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 30,
  });

  // Exit: fade out
  const exitStart = totalFrames - 25;
  const exit = spring({
    frame: localFrame > exitStart ? localFrame - exitStart : 0,
    fps,
    config: { damping: 20, stiffness: 100 },
    durationInFrames: 25,
  });
  const exitProgress = localFrame > exitStart ? 1 - exit : 1;

  const opacity = Math.min(enter, exitProgress);

  // Characters appear one by one (typewriter + bounce)
  const chars = title.split("");

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            opacity,
            transform: `scale(${0.9 + enter * 0.1})`,
          }}
        >
          {chars.map((char, i) => {
            const charDelay = i * 2;
            const charEnter = spring({
              frame: localFrame - charDelay,
              fps,
              config: { damping: 8, stiffness: 120 },
              durationInFrames: 20,
            });

            const floatY =
              emphasis && enter > 0.8
                ? Math.sin((localFrame + i * 8) / 15) * 4 * enter
                : 0;

            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: 64,
                  fontWeight: 700,
                  fontFamily: '"STSong", "Songti SC", "Noto Serif SC", "SimSun", serif',
                  background: theme.titleGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  opacity: charEnter,
                  transform: `translateY(${(1 - charEnter) * -20 + floatY}px)`,
                  textShadow:
                    emphasis && charEnter > 0.7
                      ? `0 0 30px ${theme.accentDim}`
                      : `0 0 10px ${theme.glow}`,
                  marginRight: char === "·" ? 12 : 0,
                  letterSpacing: 4,
                }}
              >
                {char === " " ? " " : char}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
