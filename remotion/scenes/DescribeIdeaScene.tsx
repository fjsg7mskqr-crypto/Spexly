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

export const DescribeIdeaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Step badge
  const badgeScale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });

  // Title slide in
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(frame, [10, 30], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Image slide in from right
  const imageX = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const imageTranslateX = interpolate(imageX, [0, 1], [200, 0]);
  const imageOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(frame, [180, 210], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        opacity: fadeIn * fadeOut,
        padding: 80,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 60,
      }}
    >
      {/* Left: Text */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "rgba(6,182,212,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${badgeScale})`,
          }}
        >
          <span
            style={{
              color: "#67e8f9",
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            1
          </span>
        </div>
        <h2
          style={{
            color: "#f1f5f9",
            fontSize: 48,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            lineHeight: 1.2,
          }}
        >
          Describe your idea
        </h2>
        <p
          style={{
            color: "#94a3b8",
            fontSize: 24,
            fontFamily: "system-ui, sans-serif",
            opacity: titleOpacity,
            lineHeight: 1.5,
            maxWidth: 500,
          }}
        >
          Pick a template or import a PRD. Our AI wizard generates your first canvas automatically.
        </p>
      </div>

      {/* Right: Screenshot */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          opacity: imageOpacity,
          transform: `translateX(${imageTranslateX}px)`,
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #334155",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          <Img
            src={staticFile("gallery-templates.png")}
            style={{ width: 520, height: "auto" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
