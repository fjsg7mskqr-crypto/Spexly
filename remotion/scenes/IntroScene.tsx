import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [30, 50], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end
  const fadeOut = interpolate(frame, [120, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        <Img
          src={staticFile("spexly-logo-white.png")}
          style={{
            width: 320,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        />
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            background:
              "linear-gradient(90deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))",
            border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: 9999,
            padding: "10px 24px",
          }}
        >
          <span
            style={{
              color: "#a5f3fc",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Spec It Before You Ship It
          </span>
        </div>
        <p
          style={{
            opacity: subtitleOpacity,
            color: "#e2e8f0",
            fontSize: 28,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Plan your AI app before you burn credits.
        </p>
      </div>
    </AbsoluteFill>
  );
};
