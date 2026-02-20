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

export const BlueprintScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Step badge
  const badgeScale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });

  // Title
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Canvas image — scale up from center
  const canvasScale = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 14, stiffness: 60 },
  });
  const canvasScaleVal = interpolate(canvasScale, [0, 1], [0.85, 1]);
  const canvasOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Nodes row slides up
  const nodesY = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const nodesTranslateY = interpolate(nodesY, [0, 1], [60, 0]);
  const nodesOpacity = interpolate(frame, [120, 145], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle zoom on canvas
  const slowZoom = interpolate(frame, [50, 280], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
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
            2
          </span>
        </div>
        <h2
          style={{
            color: "#f1f5f9",
            fontSize: 48,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            opacity: titleOpacity,
          }}
        >
          See your blueprint
        </h2>
      </div>

      {/* Canvas screenshot */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
          opacity: canvasOpacity,
          transform: `scale(${canvasScaleVal * slowZoom})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #334155",
            boxShadow: "0 25px 50px rgba(8,145,178,0.3)",
          }}
        >
          <Img
            src={staticFile("gallery-canvas.png")}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>

      {/* Node types row */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 120,
          right: 120,
          opacity: nodesOpacity,
          transform: `translateY(${nodesTranslateY}px)`,
        }}
      >
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #334155",
            backgroundColor: "#0f172a",
            padding: 16,
          }}
        >
          <Img
            src={staticFile("gallery-nodes-row.png")}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
