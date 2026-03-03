import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";

interface BrowserMockupProps {
  children: React.ReactNode;
}

// macOS-style window traffic light controls
const TrafficLights: React.FC = () => {
  const dots: { color: string; label: string }[] = [
    { color: "#FF5F57", label: "fechar" },
    { color: "#FFBD2E", label: "minimizar" },
    { color: "#28C840", label: "maximizar" },
  ];

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  };

  const dotStyle = (color: string): React.CSSProperties => ({
    width: 14,
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: color,
    flexShrink: 0,
    boxShadow: `inset 0 1px 2px rgba(0,0,0,0.25)`,
  });

  return (
    <div style={containerStyle}>
      {dots.map((dot) => (
        <div key={dot.label} style={dotStyle(dot.color)} />
      ))}
    </div>
  );
};

// URL bar component
const UrlBar: React.FC = () => {
  const urlBarStyle: React.CSSProperties = {
    flex: 1,
    maxWidth: 420,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: borderRadius.md,
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
    overflow: "hidden",
  };

  const lockIconStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    flexShrink: 0,
    opacity: 0.7,
  };

  const urlTextStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const dotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    flexShrink: 0,
  };

  return (
    <div style={urlBarStyle}>
      {/* Lock icon */}
      <svg
        style={lockIconStyle}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 5H3C2.44772 5 2 5.44772 2 6V10C2 10.5523 2.44772 11 3 11H9C9.55228 11 10 10.5523 10 10V6C10 5.44772 9.55228 5 9 5Z"
          fill="rgba(255,255,255,0.6)"
        />
        <path
          d="M4 5V3.5C4 2.11929 4.89543 1 6 1C7.10457 1 8 2.11929 8 3.5V5"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <div style={dotStyle} />
      <span style={urlTextStyle}>app.fittoday.com.br/cms</span>
    </div>
  );
};

// Browser toolbar tabs placeholder
const TabBar: React.FC = () => {
  const tabStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
    height: 32,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: `${borderRadius.md}px ${borderRadius.md}px 0 0`,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    marginBottom: -1,
  };

  const faviconStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const tabLabelStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: "rgba(255,255,255,0.85)",
    whiteSpace: "nowrap",
    maxWidth: 160,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const closeStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: borderRadius.full,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
    marginLeft: spacing[1],
  };

  return (
    <div style={tabStyle}>
      <div style={faviconStyle}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>
      <span style={tabLabelStyle}>FitToday CMS</span>
      <div style={closeStyle}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export const BrowserMockup: React.FC<BrowserMockupProps> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation
  const mountSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const scaleY = interpolate(mountSpring, [0, 1], [0.94, 1]);
  const opacity = interpolate(mountSpring, [0, 1], [0, 1]);
  const translateY = interpolate(mountSpring, [0, 1], [24, 0]);

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity,
    transform: `translateY(${translateY}px) scaleY(${scaleY})`,
    transformOrigin: "center center",
  };

  const windowStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
    boxShadow: [
      "0 50px 100px rgba(0,0,0,0.55)",
      "0 25px 50px rgba(0,0,0,0.35)",
      "0 0 0 1px rgba(255,255,255,0.06)",
    ].join(", "),
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.gray[950],
  };

  // Chrome toolbar
  const toolbarStyle: React.CSSProperties = {
    backgroundColor: "#1e293b",
    height: 52,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  // Row with traffic lights and URL
  const controlRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    flex: 1,
  };

  // Tab row above controls
  const tabRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 80,
    paddingTop: spacing[1],
    height: 36,
    flexShrink: 0,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    backgroundColor: "#172032",
  };

  // Navigation arrows
  const navArrowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    opacity: 0.5,
  };

  const arrowBtnStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Reload and other icons on right side of URL bar
  const rightIconsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    opacity: 0.5,
  };

  // Content area
  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.gray[50],
  };

  return (
    <div style={wrapperStyle}>
      <div style={windowStyle}>
        {/* Tab bar row */}
        <div style={tabRowStyle}>
          <TabBar />
        </div>

        {/* Main toolbar */}
        <div style={toolbarStyle}>
          <div style={controlRowStyle}>
            {/* Traffic light controls */}
            <TrafficLights />

            {/* Nav arrows */}
            <div style={navArrowStyle}>
              <div style={arrowBtnStyle}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M9 11L5 7L9 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div style={{ ...arrowBtnStyle, opacity: 0.3 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5 3L9 7L5 11"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* URL bar centered */}
            <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
              <UrlBar />
            </div>

            {/* Right icons */}
            <div style={rightIconsStyle}>
              {/* Bookmark */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 2H12C12.5523 2 13 2.44772 13 3V14L8 11L3 14V3C3 2.44772 3.44772 2 4 2Z"
                  stroke="white"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Extensions menu */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="1.2" fill="white" />
                <circle cx="8" cy="8" r="1.2" fill="white" />
                <circle cx="12" cy="8" r="1.2" fill="white" />
              </svg>
            </div>
          </div>
        </div>

        {/* Browser content */}
        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  );
};
