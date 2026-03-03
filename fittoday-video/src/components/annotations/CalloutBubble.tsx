import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize } from "../../theme/typography";
import { borderRadius, spacing } from "../../theme/spacing";
import { SPRING_BOUNCY, fadeOut } from "../../utils/animations";

export type CalloutDirection = "top" | "bottom" | "left" | "right";

interface CalloutBubbleProps {
  text: string;
  x: number;
  y: number;
  delay?: number;
  direction?: CalloutDirection;
  holdFrames?: number;
}

const TAIL_SIZE = 10;
const BUBBLE_PADDING_X = spacing[4];
const BUBBLE_PADDING_Y = spacing[3];

function getTailStyle(direction: CalloutDirection): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
  };

  switch (direction) {
    case "bottom":
      return {
        ...base,
        bottom: -TAIL_SIZE,
        left: "50%",
        transform: "translateX(-50%)",
        borderLeft: `${TAIL_SIZE}px solid transparent`,
        borderRight: `${TAIL_SIZE}px solid transparent`,
        borderTop: `${TAIL_SIZE}px solid ${colors.white}`,
      };
    case "top":
      return {
        ...base,
        top: -TAIL_SIZE,
        left: "50%",
        transform: "translateX(-50%)",
        borderLeft: `${TAIL_SIZE}px solid transparent`,
        borderRight: `${TAIL_SIZE}px solid transparent`,
        borderBottom: `${TAIL_SIZE}px solid ${colors.white}`,
      };
    case "left":
      return {
        ...base,
        left: -TAIL_SIZE,
        top: "50%",
        transform: "translateY(-50%)",
        borderTop: `${TAIL_SIZE}px solid transparent`,
        borderBottom: `${TAIL_SIZE}px solid transparent`,
        borderRight: `${TAIL_SIZE}px solid ${colors.white}`,
      };
    case "right":
      return {
        ...base,
        right: -TAIL_SIZE,
        top: "50%",
        transform: "translateY(-50%)",
        borderTop: `${TAIL_SIZE}px solid transparent`,
        borderBottom: `${TAIL_SIZE}px solid transparent`,
        borderLeft: `${TAIL_SIZE}px solid ${colors.white}`,
      };
  }
}

export const CalloutBubble: React.FC<CalloutBubbleProps> = ({
  text,
  x,
  y,
  delay = 0,
  direction = "bottom",
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

  const entranceOpacity = interpolate(entranceFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(entranceOpacity, exitOpacity);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: `${BUBBLE_PADDING_Y}px ${BUBBLE_PADDING_X}px`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
          whiteSpace: "nowrap",
          maxWidth: 320,
          whiteSpaceCollapse: "preserve" as any,
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.gray[900],
            letterSpacing: "0.01em",
            lineHeight: 1.4,
            display: "block",
            textAlign: "center",
          }}
        >
          {text}
        </span>
        <div style={getTailStyle(direction)} />
      </div>
    </div>
  );
};
