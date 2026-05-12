import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  count?: number;
  startFrame?: number;
  durationInFrames?: number;
}

interface Sparkle {
  x: number;
  y: number;
  delay: number;
  size: number;
  lifespan: number;
}

function generateSparkles(count: number): Sparkle[] {
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      size: 2 + Math.random() * 5,
      lifespan: 0.8 + Math.random() * 2,
    });
  }
  return sparkles;
}

const cache: Record<number, Sparkle[]> = {};

function getSparkles(count: number): Sparkle[] {
  if (!cache[count]) cache[count] = generateSparkles(count);
  return cache[count];
}

export const Sparkles: React.FC<Props> = ({
  count = 15,
  startFrame = 0,
  durationInFrames = 300,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  const sparkles = getSparkles(count);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {sparkles.map((s, i) => {
        const t = (localFrame / fps - s.delay) / s.lifespan;
        const opacity = interpolate(t, [0, 0.2, 0.8, 1], [0, 1, 0.5, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(t, [0, 0.5, 1], [0, 1, 0]);

        if (t <= 0 || t >= 1) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: `rgba(255,255,240,${opacity})`,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${s.size * 3}px rgba(255,240,200,${opacity})`,
            }}
          />
        );
      })}
    </div>
  );
};
