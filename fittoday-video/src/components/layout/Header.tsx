import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const SearchBar: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.gray[100],
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: borderRadius.lg,
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
    height: 38,
    width: 280,
    cursor: "default",
    flexShrink: 0,
  };

  const iconStyle: React.CSSProperties = {
    color: colors.gray[400],
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  };

  const textStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.gray[400],
    flex: 1,
    fontWeight: fontWeight.normal,
    whiteSpace: "nowrap" as const,
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
    flexShrink: 0,
    letterSpacing: "0.02em",
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke={colors.gray[400]} strokeWidth="1.4" />
          <path
            d="M10.5 10.5L13.5 13.5"
            stroke={colors.gray[400]}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span style={textStyle}>Em breve...</span>
      <div style={badgeStyle}>⌘K</div>
    </div>
  );
};

const NewWorkoutButton: React.FC<{ springValue: number }> = ({ springValue }) => {
  const scale = interpolate(springValue, [0, 1], [0.85, 1]);
  const opacity = interpolate(springValue, [0, 1], [0, 1]);

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    paddingTop: 0,
    paddingBottom: 0,
    height: 38,
    cursor: "pointer",
    transform: `scale(${scale})`,
    opacity,
    flexShrink: 0,
    boxShadow: `0 2px 8px rgba(16, 185, 129, 0.35), 0 1px 3px rgba(16, 185, 129, 0.2)`,
  };

  const iconStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.white,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    whiteSpace: "nowrap" as const,
    letterSpacing: "0.01em",
  };

  return (
    <div style={buttonStyle}>
      <div style={iconStyle}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3V13M3 8H13"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span style={labelStyle}>Novo Treino</span>
    </div>
  );
};

const NotificationBell: React.FC<{ springValue: number }> = ({ springValue }) => {
  const opacity = interpolate(springValue, [0.3, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: 38,
    height: 38,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    border: `1px solid ${colors.gray[200]}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    opacity,
  };

  const badgeStyle: React.CSSProperties = {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    border: `2px solid ${colors.gray[50]}`,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={containerStyle}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2C9 2 5 4 5 9V13L3 14V15H15V14L13 13V9C13 4 9 2 9 2Z"
          stroke={colors.gray[600]}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M7.5 15C7.5 15.8284 8.17157 16.5 9 16.5C9.82843 16.5 10.5 15.8284 10.5 15"
          stroke={colors.gray[600]}
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div style={badgeStyle} />
    </div>
  );
};

const UserAvatar: React.FC<{ springValue: number }> = ({ springValue }) => {
  const opacity = interpolate(springValue, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(springValue, [0.5, 1], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const avatarStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.teal[600]})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flexShrink: 0,
    cursor: "pointer",
    opacity,
    transform: `scale(${scale})`,
    boxShadow: `0 2px 8px rgba(16, 185, 129, 0.3)`,
    border: `2px solid rgba(16, 185, 129, 0.3)`,
  };

  return <div style={avatarStyle}>CS</div>;
};

// ---------------------------------------------------------------------------
// Page title area (left side of header, after sidebar)
// ---------------------------------------------------------------------------

interface PageTitleProps {
  title: string;
  subtitle?: string;
  springValue: number;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, springValue }) => {
  const opacity = interpolate(springValue, [0, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(springValue, [0, 0.5], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    opacity,
    transform: `translateY(${translateY}px)`,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.gray[500],
    lineHeight: 1.4,
  };

  return (
    <div style={containerStyle}>
      <span style={titleStyle}>{title}</span>
      {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Dashboard",
  subtitle = "Bem-vindo de volta, Carlos",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  const buttonSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 14, stiffness: 200 },
  });

  // Header slide-down entrance
  const headerOpacity = interpolate(entranceSpring, [0, 0.4], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headerTranslateY = interpolate(entranceSpring, [0, 0.6], [-12, 0], {
    extrapolateRight: "clamp",
  });

  const headerStyle: React.CSSProperties = {
    height: 68,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray[200]}`,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing[6],
    paddingRight: spacing[6],
    gap: spacing[4],
    flexShrink: 0,
    opacity: headerOpacity,
    transform: `translateY(${headerTranslateY}px)`,
  };

  const leftStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    minWidth: 0,
  };

  const rightStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flexShrink: 0,
  };

  const dividerStyle: React.CSSProperties = {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[200],
    flexShrink: 0,
  };

  return (
    <div style={headerStyle}>
      <div style={leftStyle}>
        <PageTitle
          title={title}
          subtitle={subtitle}
          springValue={entranceSpring}
        />
      </div>

      <div style={rightStyle}>
        <SearchBar />
        <div style={dividerStyle} />
        <NewWorkoutButton springValue={buttonSpring} />
        <NotificationBell springValue={entranceSpring} />
        <UserAvatar springValue={entranceSpring} />
      </div>
    </div>
  );
};
