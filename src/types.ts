export interface Photo {
  path: string;
  width: number;
  height: number;
}

export interface CategoryManifest {
  name: string;
  title: string;
  photos: Photo[];
  emphasis: boolean;
}

export interface PhotoManifest {
  music: string | null;
  duration: number;
  fps: number;
  categories: CategoryManifest[];
  style: "warm-cinematic" | "vintage" | "clean-modern";
  ending: {
    names: string;
    date: string;
    thanks: string;
    summary: string[];
  };
  totalPhotos: number;
}

export interface DisplayUnit {
  type: LayoutType;
  photos: Photo[];
  startFrame: number;
  durationInFrames: number;
  animationVariant: number;
}

export type LayoutType =
  | "fullscreen"
  | "split-two"
  | "three-layout"
  | "grid-four"
  | "asymmetric"
  | "photo-wall"
  | "blend-two";

export interface CategoryFrameBudget {
  name: string;
  title: string;
  photos: Photo[];
  emphasis: boolean;
  titleStart: number;
  photosStart: number;
  photosDuration: number;
  units: DisplayUnit[];
}

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  accentDim: string;
  muted: string;
  overlay: string;
  border: string;
  glow: string;
  titleGradient: string;
}
