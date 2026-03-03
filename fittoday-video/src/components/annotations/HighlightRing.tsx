import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { borderRadius } from "../../theme/spacing";
import { SPRING_BOUNCY, pulse } from "../../utils/animations";

interface HighlightRingProps {
  x: number;
  y: number;
  width: number;
  height: number;
  delay?: number;
  color?: string;
  holdFrames?: number;
}

export const HighlightRing: React.FC<HighlightRingProps> = ({
  x,
  y,
  width,
  height,
  delay = 0,
  color = colors.warning,
  holdFrames = 60,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entranceFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: entranceFrame,
    fps,
    config: SPRING_BOUNCY,
  });

  const exitStart = delay + holdFrames;
  const exitOpacity =
    frame >= exitStart
      ? interpolate(frame, [exitStart, exitStart + 15], [1, 0], {
          extrapolateRight: "clamp",
        })
      : 1;

  const entranceOpacity = interpolate(entranceFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(entranceOpacity, exitOpacity);

  // Pulsing glow via Math.sin
  const pulseFactor = pulse(frame, 0.12);
  const glowIntensity = 8 + Math.sin(frame * 0.12) * 4;
  const borderAlpha = 0.7 + Math.sin(frame * 0.15) * 0.3;

  // Convert hex color to rgba for glow
  const glowColor = `${color}${Math.round(borderAlpha * 255)
    .toString(16)
    .padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        transform: `scale(${scale * pulseFactor})`,
        transformOrigin: "center center",
        opacity,
        pointerEvents: "none",
        borderRadius: borderRadius.lg,
        border: `3px solid ${color}`,
        boxShadow: `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${color}40, inset 0 0 ${glowIntensity}px ${color}20`,
      }}
    />
  );
};
