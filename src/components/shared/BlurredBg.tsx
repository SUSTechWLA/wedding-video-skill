import React from "react";
import { Img, staticFile } from "remotion";
import type { Photo } from "../../types";

export const BlurredBg: React.FC<{ photo: Photo; opacity: number }> = ({ photo, opacity }) => (
  <div style={{ position: "absolute", inset: -40, filter: "blur(60px) brightness(0.35)", opacity: opacity * 0.85 }}>
    <Img src={staticFile(photo.path)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);
