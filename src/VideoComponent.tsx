import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
} from "remotion";
import { THEMES } from "./themes";
import { calculateFrameBudgets, OPENING_FRAMES, ENDING_FRAMES, TITLE_FRAMES } from "./utils";
import type { PhotoManifest } from "./types";
import { OpeningTitle } from "./components/OpeningTitle";
import { EndingCredits } from "./components/EndingCredits";
import { ChapterTitle } from "./components/ChapterTitle";
import { AudioFader } from "./components/AudioFader";
import { FullScreenPhoto } from "./components/layouts/FullScreenPhoto";
import { SplitTwo } from "./components/layouts/SplitTwo";
import { ThreeLayout } from "./components/layouts/ThreeLayout";
import { GridFour } from "./components/layouts/GridFour";
import { AsymmetricCollage } from "./components/layouts/AsymmetricCollage";
import { PhotoWall } from "./components/layouts/PhotoWall";
import { Petals } from "./components/decorations/Petals";
import { Sparkles } from "./components/decorations/Sparkles";
import { LightSweep } from "./components/decorations/LightSweep";
import { FilmGrain } from "./components/decorations/FilmGrain";
import { BlendTwo } from "./components/layouts/BlendTwo";

interface Props {
  manifest: PhotoManifest;
}

const LayoutComponent: Record<string, React.FC<any>> = {
  fullscreen: FullScreenPhoto,
  "split-two": SplitTwo,
  "three-layout": ThreeLayout,
  "grid-four": GridFour,
  asymmetric: AsymmetricCollage,
  "photo-wall": PhotoWall,
  "blend-two": BlendTwo,
};

const GlobalVignette: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 15,
        background:
          "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.5) 100%)",
      }}
    />
  );
};

export const VideoComponent: React.FC<Props> = ({ manifest }) => {
  const theme = THEMES[manifest.style];

  const budgets = useMemo(() => calculateFrameBudgets(manifest), [manifest]);

  const firstPhoto =
    manifest.categories.length > 0 && manifest.categories[0].photos.length > 0
      ? manifest.categories[0].photos[0]
      : null;

  // Calculate ending start for audio fade
  const endingStart =
    budgets.length > 0
      ? budgets[budgets.length - 1].photosStart + budgets[budgets.length - 1].photosDuration
      : OPENING_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {manifest.music && (
        <AudioFader
          musicPath={manifest.music}
          fadeOutStartFrame={endingStart - 30}
          fadeOutDuration={60}
          baseVolume={0.45}
        />
      )}

      <FilmGrain opacity={manifest.style === "vintage" ? 0.07 : 0.025} />

      <Sequence from={0} durationInFrames={OPENING_FRAMES}>
        <OpeningTitle
          date={manifest.ending.date}
          firstPhoto={firstPhoto}
          theme={theme}
        />
      </Sequence>

      {budgets.map((budget) => (
        <React.Fragment key={budget.name}>
          <Sequence from={budget.titleStart} durationInFrames={TITLE_FRAMES}>
            <ChapterTitle
              title={budget.title}
              startFrame={0}
              theme={theme}
              emphasis={budget.emphasis}
            />
          </Sequence>

          {budget.units.map((unit, unitIndex) => {
            const Layout = LayoutComponent[unit.type];
            if (!Layout) return null;

            const globalStart = budget.photosStart + unit.startFrame;

            return (
              <Sequence
                key={`${budget.name}-${unitIndex}`}
                from={globalStart}
                durationInFrames={unit.durationInFrames}
              >
                <Layout
                  photos={unit.photos}
                  startFrame={0}
                  durationInFrames={unit.durationInFrames}
                  animationVariant={unit.animationVariant}
                  theme={theme}
                  emphasis={budget.emphasis}
                />
                {budget.emphasis && (
                  <>
                    <Petals count={35} startFrame={0} durationInFrames={unit.durationInFrames} />
                    <Sparkles count={22} startFrame={0} durationInFrames={unit.durationInFrames} />
                    <LightSweep startFrame={0} durationInFrames={unit.durationInFrames} color={theme.accentDim} />
                  </>
                )}
              </Sequence>
            );
          })}
        </React.Fragment>
      ))}

      <Sequence from={endingStart} durationInFrames={ENDING_FRAMES}>
        <EndingCredits
          names={manifest.ending.names}
          date={manifest.ending.date}
          thanks={manifest.ending.thanks}
          summary={manifest.ending.summary}
          theme={theme}
        />
      </Sequence>

      {/* Persistent global vignette */}
      <GlobalVignette />
    </AbsoluteFill>
  );
};
