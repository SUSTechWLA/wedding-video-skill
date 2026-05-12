import React from "react";

/**
 * Static film grain overlay using SVG feTurbulence.
 * feComponentTransfer caps noise brightness at 25% so no pixel ever reaches
 * pure white, eliminating the white-dot flicker even at higher opacity.
 * The noise pattern is mathematically static — same every frame.
 */
export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 20,
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='0.25'/%3E%3CfeFuncG type='linear' slope='0.25'/%3E%3CfeFuncB type='linear' slope='0.25'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
};
