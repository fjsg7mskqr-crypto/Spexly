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

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const logoScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 12 },
  });

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 12 },
  });

  const urlOpacity = interpolate(frame, [90, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gentle pulse on CTA
  const pulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.03, 1],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeIn,
      }}
    >
      {/* Gradient glow background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(6,182,212,0.12) 0%, transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          position: "relative",
        }}
      >
        <Img
          src={staticFile("spexly-logo-white.png")}
          style={{
            width: 280,
            transform: `scale(${logoScale})`,
          }}
        />

        <h2
          style={{
            color: "#f1f5f9",
            fontSize: 52,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            lineHeight: 1.2,
          }}
        >
          Spec it before you ship it.
        </h2>

        {/* CTA button */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale * pulse})`,
            background: "linear-gradient(135deg, #67e8f9, #3b82f6)",
            borderRadius: 12,
            padding: "18px 48px",
          }}
        >
          <span
            style={{
              color: "#020617",
              fontSize: 26,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Join the Waitlist
          </span>
        </div>

        <p
          style={{
            opacity: urlOpacity,
            color: "#67e8f9",
            fontSize: 24,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
          }}
        >
          spexly.com
        </p>
      </div>
    </AbsoluteFill>
  );
};
