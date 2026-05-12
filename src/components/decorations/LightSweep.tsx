import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  startFrame: number;
  durationInFrames: number;
  color?: string;
}

export const LightSweep: React.FC<Props> = ({
  startFrame,
  durationInFrames,
  color = "rgba(255,255,255,0.15)",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const x = interpolate(localFrame, [0, durationInFrames], [-30, 130], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const opacity = interpolate(
    localFrame,
    [0, durationInFrames * 0.05, durationInFrames * 0.95, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        overflow: "hidden",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${x}%`,
          width: "20%",
          height: "100%",
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          transform: "skewX(-15deg)",
        }}
      />
    </div>
  );
};
