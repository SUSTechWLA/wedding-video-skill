import React from "react";
import { AbsoluteFill, Img, spring, interpolate, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import type { ThemeColors, Photo } from "../../types";
import { BlurredBg } from "../shared/BlurredBg";
import { photoWallLayout } from "../../layoutHelper";

interface Props {
  photos: Photo[]; startFrame: number; durationInFrames: number;
  animationVariant: number; theme: ThemeColors; emphasis: boolean;
}

const WALL_ENTERS = ["scatter-assemble", "drop-stack", "fade-float"];
export const PhotoWall: React.FC<Props> = ({
  photos, startFrame, durationInFrames, animationVariant, theme, emphasis,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const enterType = WALL_ENTERS[animationVariant % WALL_ENTERS.length];
  const positions = photoWallLayout(photos);

  const enterProgress = spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 60 }, durationInFrames: 30 });
  const exitStart = durationInFrames - 30;
  const exitProgress = localFrame > exitStart
    ? 1 - spring({ frame: localFrame - exitStart, fps, config: { damping: 20, stiffness: 100 }, durationInFrames: 30 })
    : 1;

  const driftX = interpolate(localFrame, [0, durationInFrames], [0, 4], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const driftY = interpolate(localFrame, [0, durationInFrames], [0, -3], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Exit effect
  const exitDir = animationVariant % 3;
  const exitFactor = 1 - exitProgress;
  const exitTransform = [
    `translateX(${exitFactor * -60}px)`,
    `translateY(${exitFactor * 60}px)`,
    `scale(${1 - exitFactor * 0.5})`,
  ][exitDir];

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: "-5%",
        transform: `translate(${driftX}px, ${driftY}px) ${exitTransform}`,
        opacity: Math.min(enterProgress, exitProgress),
      }}>
        {positions.map((pos, i) => {
          const photo = photos[i];
          if (!photo) return null;

          const staggerDelay = enterType === "drop-stack" ? i * 8 :
            enterType === "scatter-assemble" ? i * 6 : i * 5;
          const enter = spring({
            frame: localFrame - staggerDelay, fps,
            config: { damping: 10, stiffness: 50 },
            durationInFrames: 32,
          });

          const floatY = Math.sin((localFrame + i * 35) / 22) * 5 * enter;
          const floatRot = Math.sin((localFrame + i * 25) / 28) * 1.5 * enter;

          // Enter-specific transforms
          let enterTransform = "";
          switch (enterType) {
            case "scatter-assemble":
              enterTransform = `translate(${(1 - enter) * (i % 2 === 0 ? -60 : 60)}px, ${(1 - enter) * ((i < 2 ? 1 : -1) * 40)}px)`;
              break;
            case "drop-stack":
              enterTransform = `translateY(${(1 - enter) * -80}px)`;
              break;
            case "fade-float":
            default:
              enterTransform = `scale(${0.7 + enter * 0.3})`;
              break;
          }

          return (
            <div key={i} style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.w}%`,
              height: `${pos.h}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rot + floatRot}deg) ${enterTransform} translateY(${floatY}px)`,
              opacity: enter * exitProgress,
              boxShadow: "4px 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}>
              <BlurredBg photo={photo} opacity={enter * exitProgress} />
              <Img
                src={staticFile(photo.path)}
                style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
