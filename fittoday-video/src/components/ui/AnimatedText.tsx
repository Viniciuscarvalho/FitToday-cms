import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize as fontSizeMap, fontWeight as fontWeightMap } from "../../theme/typography";
import { typewriterChars } from "../../utils/animations";

type AnimationMode = "typewriter" | "fadeUp" | "slideIn";

interface AnimatedTextProps {
  text: string;
  mode: AnimationMode;
  delay?: number;
  style?: React.CSSProperties;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  mode,
  delay = 0,
  style,
  fontSize = fontSizeMap.base,
  fontWeight = fontWeightMap.normal,
  color = colors.gray[900],
}) => {
  const frame = useCurrentFrame();

  const baseStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize,
    fontWeight,
    color,
    display: "inline-block",
    lineHeight: 1.4,
    ...style,
  };

  if (mode === "typewriter") {
    const f = Math.max(0, frame - delay);
    const charsToShow = typewriterChars(f, text.length, 0, 1.5);
    const visibleText = text.slice(0, charsToShow);
    const showCursor = charsToShow < text.length || Math.floor(f / 15) % 2 === 0;

    return (
      <span style={baseStyle}>
        {visibleText}
        {showCursor && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "1.1em",
              backgroundColor: color,
              marginLeft: 2,
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </span>
    );
  }

  if (mode === "fadeUp") {
    const f = Math.max(0, frame - delay);
    const opacity = interpolate(f, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    });
    const translateY = interpolate(f, [0, 15], [20, 0], {
      extrapolateRight: "clamp",
    });

    return (
      <span
        style={{
          ...baseStyle,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {text}
      </span>
    );
  }

  if (mode === "slideIn") {
    const f = Math.max(0, frame - delay);
    const opacity = interpolate(f, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    });
    const translateX = interpolate(f, [0, 15], [-30, 0], {
      extrapolateRight: "clamp",
    });

    return (
      <span
        style={{
          ...baseStyle,
          opacity,
          transform: `translateX(${translateX}px)`,
        }}
      >
        {text}
      </span>
    );
  }

  return <span style={baseStyle}>{text}</span>;
};
