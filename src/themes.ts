import type { ThemeColors } from "./types";

export const THEMES: Record<string, ThemeColors> = {
  "warm-cinematic": {
    bg: "#0d0d0d",
    text: "#f5e6d3",
    accent: "#d4a853",
    accentDim: "rgba(212,168,83,0.4)",
    muted: "rgba(245,230,211,0.5)",
    overlay: "rgba(13,13,13,0.6)",
    border: "rgba(212,168,83,0.25)",
    glow: "rgba(212,168,83,0.15)",
    titleGradient: "linear-gradient(135deg, #d4a853 0%, #f5e6d3 50%, #d4a853 100%)",
  },
  vintage: {
    bg: "#1a1410",
    text: "#e8dcc8",
    accent: "#c2855b",
    accentDim: "rgba(194,133,91,0.4)",
    muted: "rgba(232,220,200,0.5)",
    overlay: "rgba(26,20,16,0.6)",
    border: "rgba(194,133,91,0.25)",
    glow: "rgba(194,133,91,0.12)",
    titleGradient: "linear-gradient(135deg, #c2855b 0%, #e8dcc8 50%, #c2855b 100%)",
  },
  "clean-modern": {
    bg: "#fafafa",
    text: "#1a1a2e",
    accent: "#4a90d9",
    accentDim: "rgba(74,144,217,0.3)",
    muted: "rgba(26,26,46,0.4)",
    overlay: "rgba(250,250,250,0.5)",
    border: "rgba(74,144,217,0.2)",
    glow: "rgba(74,144,217,0.1)",
    titleGradient: "linear-gradient(135deg, #4a90d9 0%, #1a1a2e 50%, #4a90d9 100%)",
  },
};
