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

export const BuildClarityScene: React.FC = () => {
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

  // Export panel slides in from left
  const exportSpring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const exportX = interpolate(exportSpring, [0, 1], [-150, 0]);
  const exportOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress panel slides in from right
  const progressSpring = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const progressX = interpolate(progressSpring, [0, 1], [150, 0]);
  const progressOpacity = interpolate(frame, [60, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tool names appear
  const toolsOpacity = interpolate(frame, [110, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [210, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tools = ["Cursor", "Bolt", "Claude", "Lovable", "Replit", "v0"];

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
          top: 50,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
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
            4
          </span>
        </div>
        <h2
          style={{
            color: "#f1f5f9",
            fontSize: 48,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          Build with clarity
        </h2>
      </div>

      {/* Two panels side by side */}
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 120,
          right: 120,
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* Export panel */}
        <div
          style={{
            opacity: exportOpacity,
            transform: `translateX(${exportX}px)`,
            flex: "0 0 340px",
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #334155",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={staticFile("gallery-export.png")}
              style={{ width: 340, height: "auto" }}
            />
          </div>
          <p
            style={{
              color: "#67e8f9",
              fontSize: 18,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Export to any tool
          </p>
        </div>

        {/* Progress panel */}
        <div
          style={{
            opacity: progressOpacity,
            transform: `translateX(${progressX}px)`,
            flex: "0 0 420px",
          }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #334155",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <Img
              src={staticFile("gallery-progress.png")}
              style={{ width: 420, height: "auto" }}
            />
          </div>
          <p
            style={{
              color: "#67e8f9",
              fontSize: 18,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Track your progress
          </p>
        </div>
      </div>

      {/* Tool names bar */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          opacity: toolsOpacity,
        }}
      >
        {tools.map((tool) => (
          <span
            key={tool}
            style={{
              color: "#64748b",
              fontSize: 22,
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {tool}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
