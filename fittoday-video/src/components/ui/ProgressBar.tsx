import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { borderRadius } from "../../theme/spacing";

interface ProgressBarProps {
  progress: number;
  color?: string;
  delay?: number;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = colors.primary[500],
  delay = 0,
  height = 8,
}) => {
  const frame = useCurrentFrame();

  const f = Math.max(0, frame - delay);

  const animatedWidth = interpolate(f, [0, 30], [0, progress], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const trackStyle: React.CSSProperties = {
    width: "100%",
    height,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: "hidden",
    position: "relative",
  };

  const fillStyle: React.CSSProperties = {
    height: "100%",
    width: `${animatedWidth}%`,
    backgroundColor: color,
    borderRadius: borderRadius.full,
    position: "absolute",
    top: 0,
    left: 0,
    transition: "none",
  };

  return (
    <div style={trackStyle}>
      <div style={fillStyle} />
    </div>
  );
};
