import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  count?: number;
  startFrame?: number;
  durationInFrames?: number;
}

interface Petal {
  x: number;
  y: number;
  delay: number;
  size: number;
  rotation: number;
  color: string;
}

const PETAL_COLORS = [
  "rgba(255,182,193,0.7)",
  "rgba(255,160,180,0.6)",
  "rgba(255,200,210,0.65)",
  "rgba(255,192,203,0.55)",
  "rgba(255,220,220,0.6)",
];

function generatePetals(count: number): Petal[] {
  const petals: Petal[] = [];
  for (let i = 0; i < count; i++) {
    petals.push({
      x: Math.random() * 100,
      y: -5 - Math.random() * 15,
      delay: Math.random() * 3,
      size: 8 + Math.random() * 16,
      rotation: Math.random() * 360,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    });
  }
  return petals;
}

// Memoize petals per count
const petalCache: Record<number, Petal[]> = {};

function getPetals(count: number): Petal[] {
  if (!petalCache[count]) {
    petalCache[count] = generatePetals(count);
  }
  return petalCache[count];
}

export const Petals: React.FC<Props> = ({
  count = 20,
  startFrame = 0,
  durationInFrames = 300,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const petals = getPetals(count);

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
      {petals.map((petal, i) => {
        const progress = (localFrame / fps - petal.delay) / (durationInFrames / fps / 3);
        const y = interpolate(progress, [0, 1], [0, 110], { extrapolateRight: "clamp" });
        const xSway = Math.sin(progress * 8 + i) * 5;
        const rotation = petal.rotation + progress * 200;
        const opacity = interpolate(progress, [0, 0.1, 0.8, 1], [0, 0.7, 0.5, 0], {
          extrapolateLeft: "clamp",
        });

        if (progress < 0 || progress > 1) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${petal.x + xSway}%`,
              top: `${y}%`,
              width: petal.size,
              height: petal.size * 0.6,
              borderRadius: "50% 0 50% 0",
              backgroundColor: petal.color,
              transform: `rotate(${rotation}deg)`,
              opacity,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </div>
  );
};
