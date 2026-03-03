import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { borderRadius, spacing } from "../../theme/spacing";
import { SPRING_SMOOTH, stagger, fadeUpIn } from "../../utils/animations";

interface StepIndicatorProps {
  current: number;
  total: number;
  delay?: number;
}

const DOT_SIZE_INACTIVE = 10;
const DOT_SIZE_ACTIVE = 24;
const DOT_GAP = spacing[2];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  current,
  total,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelAnim = fadeUpIn(frame, delay);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing[2],
        pointerEvents: "none",
      }}
    >
      {/* Label "Passo X de Y" */}
      <div
        style={{
          ...labelAnim,
          fontFamily: fonts.body,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.gray[400],
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}
      >
        Passo {current} de {total}
      </div>

      {/* Dot row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: DOT_GAP,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const stepIndex = i + 1;
          const isActive = stepIndex === current;
          const isCompleted = stepIndex < current;
          const dotDelay = stagger(i, delay + 5, 6);
          const dotFrame = Math.max(0, frame - dotDelay);

          const scaleValue = spring({
            frame: dotFrame,
            fps,
            config: SPRING_SMOOTH,
          });

          const dotOpacity = interpolate(dotFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });

          const dotWidth = interpolate(
            spring({ frame: dotFrame, fps, config: SPRING_SMOOTH }),
            [0, 1],
            [isActive ? DOT_SIZE_INACTIVE : DOT_SIZE_INACTIVE, isActive ? DOT_SIZE_ACTIVE : DOT_SIZE_INACTIVE],
            { extrapolateRight: "clamp" }
          );

          let bgColor: string;
          if (isActive) {
            bgColor = colors.primary[500];
          } else if (isCompleted) {
            bgColor = colors.primary[700];
          } else {
            bgColor = colors.gray[600];
          }

          return (
            <div
              key={stepIndex}
              style={{
                width: isActive ? DOT_SIZE_ACTIVE : DOT_SIZE_INACTIVE,
                height: DOT_SIZE_INACTIVE,
                borderRadius: borderRadius.full,
                backgroundColor: bgColor,
                opacity: dotOpacity,
                transform: `scale(${scaleValue})`,
                transition: "width 0.3s ease",
                boxShadow: isActive
                  ? `0 0 8px ${colors.primary[500]}80`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
