import "./index.css";
import { Composition } from "remotion";
import { VideoComponent } from "./VideoComponent";
import manifest from "./photoManifest.json";
import type { PhotoManifest } from "./types";

// Error boundary to fall back when manifest doesn't exist yet
let safeManifest: PhotoManifest;
try {
  safeManifest = manifest as PhotoManifest;
} catch {
  safeManifest = {
    music: null,
    duration: 10,
    fps: 30,
    categories: [],
    style: "warm-cinematic",
    ending: { names: "", date: "", thanks: "", summary: [] },
    totalPhotos: 0,
  };
}

const durationInFrames = safeManifest.duration * safeManifest.fps;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WeddingVideo"
        component={VideoComponent as any}
        durationInFrames={durationInFrames}
        fps={safeManifest.fps}
        width={1920}
        height={1080}
        defaultProps={{ manifest: safeManifest }}
      />
    </>
  );
};
