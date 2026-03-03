import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";

type SenderType = "student" | "trainer";

interface ChatBubbleProps {
  content: string;
  sender: SenderType;
  time: string;
  showChecks?: boolean;
  delay?: number;
}

const DoubleCheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width={16}
    height={10}
    viewBox="0 0 16 10"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path
      d="M1 5L4.5 8.5L10 2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 5L8.5 8.5L14 2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  sender,
  time,
  showChecks = false,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  const isTrainer = sender === "trainer";
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(f, [0, 10], [isTrainer ? 20 : -20, 0], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(f, [0, 10], [0.92, 1], {
    extrapolateRight: "clamp",
  });

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: isTrainer ? "flex-end" : "flex-start",
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    opacity,
    transform: `translateX(${translateX}px) scale(${scale})`,
  };

  const bubbleStyle: React.CSSProperties = {
    maxWidth: "72%",
    backgroundColor: isTrainer ? colors.primary[500] : colors.gray[100],
    color: isTrainer ? colors.white : colors.gray[900],
    borderRadius: isTrainer
      ? `${borderRadius["2xl"]}px ${borderRadius["2xl"]}px ${borderRadius.sm}px ${borderRadius["2xl"]}px`
      : `${borderRadius["2xl"]}px ${borderRadius["2xl"]}px ${borderRadius["2xl"]}px ${borderRadius.sm}px`,
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    display: "flex",
    flexDirection: "column",
    gap: spacing[1],
    boxShadow: isTrainer
      ? "0 2px 12px rgba(16, 185, 129, 0.28)"
      : "0 1px 4px rgba(0,0,0,0.06)",
  };

  const textStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: isTrainer ? colors.white : colors.gray[800],
    lineHeight: 1.5,
    margin: 0,
  };

  const metaRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    justifyContent: "flex-end",
    marginTop: 2,
  };

  const timeStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeight.normal,
    color: isTrainer ? "rgba(255,255,255,0.7)" : colors.gray[400],
  };

  const checkColor = isTrainer ? "rgba(255,255,255,0.85)" : colors.gray[400];

  return (
    <div style={wrapperStyle}>
      <div style={bubbleStyle}>
        <p style={textStyle}>{content}</p>
        <div style={metaRowStyle}>
          <span style={timeStyle}>{time}</span>
          {showChecks && isTrainer && <DoubleCheckIcon color={checkColor} />}
        </div>
      </div>
    </div>
  );
};
