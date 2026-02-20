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

export const FeatureDepthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const badgeScale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleX = interpolate(frame, [10, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Panel slides in from left
  const panelX = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const panelTranslateX = interpolate(panelX, [0, 1], [-200, 0]);
  const panelOpacity = interpolate(frame, [25, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Highlight callouts appear
  const callout1Opacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const callout2Opacity = interpolate(frame, [110, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const callout3Opacity = interpolate(frame, [140, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [210, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const callouts = [
    { label: "User stories", opacity: callout1Opacity, top: 280 },
    { label: "Acceptance criteria", opacity: callout2Opacity, top: 440 },
    { label: "Priority & effort", opacity: callout3Opacity, top: 600 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        opacity: fadeIn * fadeOut,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: 80,
        gap: 60,
      }}
    >
      {/* Left: Feature panel image */}
      <div
        style={{
          flex: "0 0 420px",
          opacity: panelOpacity,
          transform: `translateX(${panelTranslateX}px)`,
          position: "relative",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #334155",
            boxShadow: "0 25px 50px rgba(8,145,178,0.25)",
          }}
        >
          <Img
            src={staticFile("gallery-feature-panel.png")}
            style={{ width: 420, height: "auto" }}
          />
        </div>
      </div>

      {/* Right: Text + callouts */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
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
            3
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
          Spec every feature
          <br />
          in depth
        </h2>
        <p
          style={{
            color: "#94a3b8",
            fontSize: 22,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.5,
            maxWidth: 500,
            opacity: titleOpacity,
          }}
        >
          Each node captures everything your AI coding tool needs to build it right the first time.
        </p>

        {/* Animated callout pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          {callouts.map((c) => (
            <div
              key={c.label}
              style={{
                opacity: c.opacity,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#06b6d4",
                }}
              />
              <span
                style={{
                  color: "#e2e8f0",
                  fontSize: 22,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 500,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
