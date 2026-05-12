import React from "react";
import { Audio, interpolate, useCurrentFrame, staticFile } from "remotion";

interface Props {
  musicPath: string;
  fadeOutStartFrame: number;
  fadeOutDuration: number;
  baseVolume?: number;
}

export const AudioFader: React.FC<Props> = ({
  musicPath,
  fadeOutStartFrame,
  fadeOutDuration,
  baseVolume = 0.5,
}) => {
  const frame = useCurrentFrame();

  // Fade in at the start
  const fadeIn = interpolate(frame, [0, 60], [0, baseVolume], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Fade out near the end
  const fadeOut = interpolate(
    frame,
    [fadeOutStartFrame, fadeOutStartFrame + fadeOutDuration],
    [baseVolume, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );

  const volume = frame < 60 ? fadeIn : frame > fadeOutStartFrame ? fadeOut : baseVolume;

  return <Audio src={staticFile(musicPath)} volume={volume} />;
};
