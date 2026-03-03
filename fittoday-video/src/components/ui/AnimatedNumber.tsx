import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../../theme/colors";
import {
  fonts,
  fontSize as fontSizeMap,
  fontWeight as fontWeightMap,
} from "../../theme/typography";
import { countUp } from "../../utils/animations";

interface AnimatedNumberProps {
  value: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  style,
  duration = 30,
}) => {
  const frame = useCurrentFrame();

  const rawCurrent = countUp(frame, value, delay, duration);

  const displayValue =
    decimals > 0
      ? interpolateDecimal(frame, value, delay, duration, decimals)
      : rawCurrent;

  const formatted =
    decimals > 0
      ? (displayValue as number).toFixed(decimals)
      : String(displayValue);

  const baseStyle: React.CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSizeMap["4xl"],
    fontWeight: fontWeightMap.bold,
    color: colors.gray[900],
    display: "inline-block",
    fontVariantNumeric: "tabular-nums",
    ...style,
  };

  return (
    <span style={baseStyle}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

function interpolateDecimal(
  frame: number,
  target: number,
  startFrame: number,
  duration: number,
  decimals: number
): number {
  const progress = Math.min(
    Math.max((frame - startFrame) / duration, 0),
    1
  );
  const current = progress * target;
  const factor = Math.pow(10, decimals);
  return Math.round(current * factor) / factor;
}
