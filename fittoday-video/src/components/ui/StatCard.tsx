import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { countUp, fadeUpIn, SPRING_SNAPPY } from "../../utils/animations";

type IconName = "users" | "dumbbell" | "dollar" | "star";

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change?: number;
  gradientColors: [string, string];
  icon: IconName;
  delay?: number;
}

const UsersIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M23 21v-2a4 4 0 0 0-3-3.87"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DumbbellIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6.5 6.5h11M6.5 17.5h11M6 3v18M18 3v18"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="3" y="7" width="3" height="10" rx="1.5" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.3} />
    <rect x="18" y="7" width="3" height="10" rx="1.5" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.3} />
  </svg>
);

const DollarIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="1" x2="12" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <path
      d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.3}
    />
  </svg>
);

const iconComponents: Record<IconName, React.FC<{ size: number; color: string }>> = {
  users: UsersIcon,
  dumbbell: DumbbellIcon,
  dollar: DollarIcon,
  star: StarIcon,
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = "",
  prefix = "",
  change,
  gradientColors,
  icon,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRING_SNAPPY,
  });

  const entrance = fadeUpIn(frame, delay);

  const currentValue = countUp(frame, value, delay + 10, 45);

  const IconComponent = iconComponents[icon];

  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? colors.success : colors.error;
  const changePrefix = isPositive ? "+" : "";

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius["2xl"],
    padding: spacing[6],
    display: "flex",
    flexDirection: "column",
    gap: spacing[4],
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    transform: `scale(${scaleSpring})`,
    opacity: entrance.opacity,
    position: "relative",
    overflow: "hidden",
    width: "100%",
  };

  const headerRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const iconCircleStyle: React.CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
    margin: 0,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    margin: 0,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  };

  const changeBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: isPositive
      ? "rgba(34, 197, 94, 0.12)"
      : "rgba(239, 68, 68, 0.12)",
    color: changeColor,
    borderRadius: borderRadius.full,
    paddingLeft: spacing[2],
    paddingRight: spacing[2],
    paddingTop: 4,
    paddingBottom: 4,
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[2],
    alignSelf: "flex-start",
  };

  return (
    <div style={cardStyle}>
      <div style={headerRowStyle}>
        <p style={titleStyle}>{title}</p>
        <div style={iconCircleStyle}>
          <IconComponent size={24} color={colors.white} />
        </div>
      </div>

      <div>
        <p style={valueStyle}>
          {prefix}
          {currentValue.toLocaleString("pt-BR")}
          {suffix}
        </p>

        {change !== undefined && (
          <div style={changeBadgeStyle}>
            <span>{changePrefix}{Math.abs(change).toFixed(1)}%</span>
            <span style={{ fontSize: fontSize.xs }}>
              {isPositive ? "▲" : "▼"}
            </span>
            <span style={{ color: colors.gray[400], fontWeight: fontWeight.normal }}>
              vs. mes anterior
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
