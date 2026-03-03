import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";

// ---------------------------------------------------------------------------
// Nav item type
// ---------------------------------------------------------------------------

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isElite?: boolean;
}

interface SidebarProps {
  activeItem?: string;
}

// ---------------------------------------------------------------------------
// SVG icons (inline, minimal, 20×20 viewBox)
// ---------------------------------------------------------------------------

const IconDashboard: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconTreinos: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="3" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="5" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="11" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="7" y="6" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconAlunos: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M1 16C1 13.2386 3.68629 11 7 11C10.3137 11 13 13.2386 13 16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="13.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M15 11C16.6569 11.5 17.5 12.5 17.5 16"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const IconMensagens: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M2 3C2 2.44772 2.44772 2 3 2H15C15.5523 2 16 2.44772 16 3V11C16 11.5523 15.5523 12 15 12H10L6 16V12H3C2.44772 12 2 11.5523 2 11V3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <line x1="5" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="5" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconAnalytics: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <polyline
      points="1,14 5,8 8,11 12,5 17,9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <line x1="1" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconFinanceiro: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <line x1="1" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="10" width="4" height="2" rx="0.5" fill="currentColor" />
  </svg>
);

const IconConfiguracoes: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M9 1V3M9 15V17M1 9H3M15 9H17M2.93 2.93L4.34 4.34M13.66 13.66L15.07 15.07M2.93 15.07L4.34 13.66M13.66 4.34L15.07 2.93"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconLock: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <rect x="1" y="4.5" width="8" height="5" rx="1" fill="currentColor" />
    <path
      d="M3 4.5V3C3 1.89543 3.89543 1 5 1C6.10457 1 7 1.89543 7 3V4.5"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="none"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Nav items data
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { id: "treinos", label: "Treinos", icon: <IconTreinos /> },
  { id: "alunos", label: "Alunos", icon: <IconAlunos /> },
  { id: "mensagens", label: "Mensagens", icon: <IconMensagens />, isElite: true },
  { id: "analytics", label: "Analytics", icon: <IconAnalytics /> },
  { id: "financeiro", label: "Financeiro", icon: <IconFinanceiro /> },
  { id: "configuracoes", label: "Configurações", icon: <IconConfiguracoes /> },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const EliteBadge: React.FC = () => {
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    border: "1px solid rgba(234, 179, 8, 0.35)",
    borderRadius: borderRadius.full,
    paddingLeft: spacing[1],
    paddingRight: spacing[1],
    paddingTop: 2,
    paddingBottom: 2,
    color: "#eab308",
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: fontWeight.semibold,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    marginLeft: "auto",
    flexShrink: 0,
  };

  return (
    <div style={style}>
      <IconLock />
      Elite
    </div>
  );
};

interface NavItemRowProps {
  item: NavItem;
  isActive: boolean;
  springValue: number;
  index: number;
  entranceProgress: number;
}

const NavItemRow: React.FC<NavItemRowProps> = ({
  item,
  isActive,
  springValue,
  index,
  entranceProgress,
}) => {
  // Staggered entrance
  const staggeredOpacity = interpolate(
    entranceProgress,
    [index * 0.08, index * 0.08 + 0.4],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const staggeredX = interpolate(
    entranceProgress,
    [index * 0.08, index * 0.08 + 0.4],
    [-16, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Active highlight via spring
  const bgOpacity = interpolate(springValue, [0, 1], [0, 1]);
  const indicatorScaleY = interpolate(springValue, [0, 1], [0, 1]);

  const rowStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingLeft: spacing[4],
    paddingRight: spacing[3],
    paddingTop: spacing[2] + 2,
    paddingBottom: spacing[2] + 2,
    borderRadius: borderRadius.lg,
    marginLeft: spacing[2],
    marginRight: spacing[2],
    cursor: "pointer",
    opacity: staggeredOpacity,
    transform: `translateX(${staggeredX}px)`,
    overflow: "hidden",
  };

  const bgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: isActive
      ? "rgba(16, 185, 129, 0.12)"
      : "transparent",
    opacity: isActive ? bgOpacity : 1,
    borderRadius: borderRadius.lg,
    transition: "background-color 0.15s ease",
  };

  // Left border indicator
  const indicatorStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: "50%",
    width: 3,
    height: isActive ? `${interpolate(springValue, [0, 1], [0, 24])}px` : 0,
    backgroundColor: colors.primary[400],
    borderRadius: `0 ${borderRadius.sm}px ${borderRadius.sm}px 0`,
    transform: `translateY(-50%) scaleY(${indicatorScaleY})`,
    transformOrigin: "center center",
    opacity: bgOpacity,
  };

  const iconStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: isActive ? colors.primary[400] : colors.gray[500],
    flexShrink: 0,
    position: "relative",
    zIndex: 1,
    transition: "color 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.normal,
    color: isActive ? colors.white : colors.gray[400],
    flex: 1,
    position: "relative",
    zIndex: 1,
    transition: "color 0.15s ease",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={rowStyle}>
      <div style={bgStyle} />
      <div style={indicatorStyle} />
      <div style={iconStyle}>{item.icon}</div>
      <span style={labelStyle}>{item.label}</span>
      {item.isElite && <EliteBadge />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// User area at bottom
// ---------------------------------------------------------------------------

const UserArea: React.FC<{ entranceProgress: number }> = ({ entranceProgress }) => {
  const opacity = interpolate(entranceProgress, [0.7, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(entranceProgress, [0.7, 1], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    opacity,
    transform: `translateY(${translateY}px)`,
  };

  const avatarStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.teal[600]})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const badgeRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
  };

  const proBadgeStyle: React.CSSProperties = {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    border: `1px solid rgba(16, 185, 129, 0.3)`,
    borderRadius: borderRadius.full,
    paddingLeft: spacing[2],
    paddingRight: spacing[2],
    paddingTop: 2,
    paddingBottom: 2,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.primary[400],
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  };

  const chevronStyle: React.CSSProperties = {
    color: colors.gray[600],
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={avatarStyle}>CS</div>
      <div style={infoStyle}>
        <span style={nameStyle}>Carlos Silva</span>
        <div style={badgeRowStyle}>
          <span style={proBadgeStyle}>Pro</span>
        </div>
      </div>
      <div style={chevronStyle}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M5 3L9 7L5 11"
            stroke={colors.gray[600]}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

const Logo: React.FC<{ entranceProgress: number }> = ({ entranceProgress }) => {
  const opacity = interpolate(entranceProgress, [0, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(entranceProgress, [0, 0.25], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    paddingLeft: spacing[5],
    paddingRight: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
    opacity,
    transform: `scale(${scale})`,
    transformOrigin: "left center",
  };

  const logoTextStyle: React.CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  };

  const dotStyle: React.CSSProperties = {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[400],
    marginLeft: 1,
    verticalAlign: "middle",
    position: "relative",
    top: -1,
  };

  return (
    <div style={containerStyle}>
      <span style={logoTextStyle}>
        FitToday<span style={dotStyle} />
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ label: string; entranceProgress: number; delay: number }> = ({
  label,
  entranceProgress,
  delay,
}) => {
  const opacity = interpolate(entranceProgress, [delay, delay + 0.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const style: React.CSSProperties = {
    paddingLeft: spacing[4] + spacing[2],
    paddingRight: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[1],
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    opacity,
  };

  return <div style={style}>{label}</div>;
};

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export const Sidebar: React.FC<SidebarProps> = ({ activeItem = "dashboard" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall sidebar entrance
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  // Per-item active spring (reacts when activeItem changes — in static use, frame 0 drives this)
  const activeSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 220 },
  });

  const sidebarStyle: React.CSSProperties = {
    width: 240,
    height: "100%",
    backgroundColor: colors.sidebar,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    flexShrink: 0,
    overflow: "hidden",
    transform: `translateX(${interpolate(entranceSpring, [0, 1], [-20, 0])}px)`,
    opacity: interpolate(entranceSpring, [0, 0.3], [0, 1], {
      extrapolateRight: "clamp",
    }),
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    paddingBottom: spacing[2],
  };

  const mainItems = NAV_ITEMS.filter(
    (i) => !["configuracoes"].includes(i.id)
  );
  const settingsItems = NAV_ITEMS.filter((i) => i.id === "configuracoes");

  return (
    <div style={sidebarStyle}>
      <Logo entranceProgress={entranceSpring} />

      <div style={navStyle}>
        <SectionLabel label="Menu Principal" entranceProgress={entranceSpring} delay={0.2} />

        {mainItems.map((item, index) => (
          <NavItemRow
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            springValue={activeItem === item.id ? activeSpring : 0}
            index={index}
            entranceProgress={entranceSpring}
          />
        ))}

        <SectionLabel label="Sistema" entranceProgress={entranceSpring} delay={0.55} />

        {settingsItems.map((item, index) => (
          <NavItemRow
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            springValue={activeItem === item.id ? activeSpring : 0}
            index={index + mainItems.length}
            entranceProgress={entranceSpring}
          />
        ))}
      </div>

      <UserArea entranceProgress={entranceSpring} />
    </div>
  );
};
