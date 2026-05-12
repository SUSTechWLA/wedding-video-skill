import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { kenBurns } from "../../layoutHelper";
import { BlurredBg } from "../shared/BlurredBg";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const ENTER_ANIMS = [
  "fade-in", "slide-left", "slide-right", "slide-up",
  "scale-bounce", "rotate-pop", "circle-reveal", "shutter-flip",
  "zoom-blur", "slide-diagonal", "flip-3d", "elastic-bounce",
];

const EXIT_ANIMS = [
  "fade-out", "slide-out-left", "slide-out-right", "zoom-out",
];

export const FullScreenPhoto: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  const photo = photos[0];

  const enterType = ENTER_ANIMS[animationVariant % ENTER_ANIMS.length];
  const exitType = EXIT_ANIMS[animationVariant % EXIT_ANIMS.length];
  const enterProgress = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 25 });

  const exitStart = Math.max(0, durationInFrames - 28);
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 28 })
    : 1;

  const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const kb = kenBurns(photo, progress, emphasis ? 1.3 : 0.8);

  // Enter animation transforms
  let enterTransform = "";
  let enterOpacity = enterProgress;
  let enterClip: string | undefined;
  let enterFilter = "";

  switch (enterType) {
    case "slide-left": enterTransform = `translateX(${(1 - enterProgress) * -100}px)`; break;
    case "slide-right": enterTransform = `translateX(${(1 - enterProgress) * 100}px)`; break;
    case "slide-up": enterTransform = `translateY(${(1 - enterProgress) * 50}px)`; break;
    case "scale-bounce": enterTransform = `scale(${enterProgress})`; break;
    case "rotate-pop": enterTransform = `rotate(${(1 - enterProgress) * -4}deg) scale(${0.88 + enterProgress * 0.12})`; break;
    case "circle-reveal": enterClip = `circle(${enterProgress * 100}% at center)`; break;
    case "shutter-flip": {
      const s = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 100 }, durationInFrames: 22 });
      enterClip = `inset(${(1 - s) * 50}% 0)`; break;
    }
    case "zoom-blur": {
      const blurRadius = (1 - enterProgress) * 12;
      enterTransform = `scale(${0.7 + enterProgress * 0.3})`;
      if (blurRadius > 0.1) enterFilter = `blur(${blurRadius}px)`;
      break;
    }
    case "slide-diagonal": enterTransform = `translate(${(1 - enterProgress) * -60}px, ${(1 - enterProgress) * -40}px)`; break;
    case "flip-3d": enterTransform = `perspective(1200px) rotateY(${(1 - enterProgress) * 90}deg)`; break;
    case "elastic-bounce": {
      const overshoot = spring({ frame: localFrame, fps, config: { damping: 6, stiffness: 120 }, durationInFrames: 28 });
      enterTransform = `scale(${overshoot})`;
      enterOpacity = Math.min(1, overshoot);
      break;
    }
    default: enterOpacity = enterProgress;
  }

  // Exit animation transforms
  let exitTransform = "";
  const exitFactor = 1 - exitProgress;
  switch (exitType) {
    case "slide-out-left": exitTransform = `translateX(${exitFactor * -100}px)`; break;
    case "slide-out-right": exitTransform = `translateX(${exitFactor * 100}px)`; break;
    case "zoom-out": exitTransform = `scale(${1 - exitFactor * 0.4})`; break;
  }

  const opacity = Math.min(enterOpacity, exitProgress);
  const transform = [
    enterTransform,
    exitTransform,
    `translateX(${kb.x}px)`,
    `translateY(${kb.y}px)`,
    `scale(${kb.scale})`,
  ].filter(Boolean).join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden", clipPath: enterClip }}>
      {photo && (
        <>
          <BlurredBg photo={photo} opacity={opacity} />
          {/* Sharp foreground — contain, no cropping */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
            <Img
              src={staticFile(photo.path)}
              style={{ width: "100%", height: "100%", objectFit: "contain", opacity, transform, filter: enterFilter || undefined }}
            />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
