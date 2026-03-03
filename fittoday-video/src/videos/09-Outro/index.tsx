import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { OutroScene } from "../../components/3d/OutroScene";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { plans } from "../../utils/mockData";
import { SPRING_BOUNCY, SPRING_SNAPPY, pulse, fadeIn, fadeUpIn } from "../../utils/animations";
import { Badge } from "../../components/ui/Badge";

// ---------------------------------------------------------------------------
// Feature icons SVG paths
// ---------------------------------------------------------------------------

const FEATURES: {
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    label: "Dashboard",
    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    color: colors.info,
  },
  {
    label: "Treinos",
    icon: "M6.5 6.5h.01M17.5 6.5h.01M6.5 17.5h.01M17.5 17.5h.01M12 12h.01M3 8c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z",
    color: "#f59e0b",
  },
  {
    label: "Alunos",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    color: colors.primary[500],
  },
  {
    label: "Mensagens",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    color: "#a855f7",
  },
  {
    label: "Analytics",
    icon: "M18 20V10 M12 20V4 M6 20v-6",
    color: colors.info,
  },
  {
    label: "Financeiro",
    icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    color: colors.primary[500],
  },
  {
    label: "Configuracoes",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    color: colors.gray[600],
  },
];

// ---------------------------------------------------------------------------
// Scene 1: Feature Montage (0-360)
// ---------------------------------------------------------------------------

// Grid layout: 3 top + 1 center + 3 bottom
const GRID_POSITIONS: { x: number; y: number }[] = [
  { x: 640, y: 300 },    // Dashboard (top-left)
  { x: 960, y: 260 },    // Treinos (top-center)
  { x: 1280, y: 300 },   // Alunos (top-right)
  { x: 500, y: 540 },    // Mensagens (left)
  { x: 960, y: 540 },    // Analytics (center)
  { x: 1420, y: 540 },   // Financeiro (right)
  { x: 960, y: 800 },    // Configuracoes (bottom-center)
];

const FeatureIcon: React.FC<{
  label: string;
  icon: string;
  color: string;
  position: { x: number; y: number };
  delay: number;
  pulseDelay: number;
  frame: number;
  fps: number;
}> = ({ label, icon, color, position, delay, pulseDelay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay);
  const s = spring({ frame: localFrame, fps, config: SPRING_BOUNCY });
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulse sequence: each icon pulses in turn
  const pulseFrame = Math.max(0, frame - pulseDelay);
  const pulseProgress = interpolate(pulseFrame, [0, 20, 40], [1, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) scale(${s * pulseProgress})`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing[3],
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: borderRadius.full,
          backgroundColor: `${color}18`,
          border: `2px solid ${color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 24px ${color}30`,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={icon} />
        </svg>
      </div>

      {/* Label */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.gray[300],
          textAlign: "center" as const,
          whiteSpace: "nowrap" as const,
        }}
      >
        {label}
      </span>
    </div>
  );
};

const FeatureMontageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title fade
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.gray[950],
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${colors.primary[900]}20, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: `translateX(-50%) translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center" as const,
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSize["4xl"],
            fontWeight: fontWeight.bold,
            color: colors.white,
            letterSpacing: "-0.02em",
          }}
        >
          Tudo que voce precisa para crescer
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.lg,
            color: colors.gray[400],
            marginTop: spacing[2],
          }}
        >
          Uma plataforma completa para personal trainers
        </div>
      </div>

      {/* Feature icons */}
      {FEATURES.map((f, i) => (
        <FeatureIcon
          key={f.label}
          label={f.label}
          icon={f.icon}
          color={f.color}
          position={GRID_POSITIONS[i]}
          delay={40 + i * 20}
          pulseDelay={200 + i * 25}
          frame={frame}
          fps={fps}
        />
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2: Pricing Plans (360-720)
// ---------------------------------------------------------------------------

const OutroPlanCard: React.FC<{
  plan: typeof plans[number];
  delay: number;
  frame: number;
  fps: number;
}> = ({ plan, delay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay);
  const s = spring({ frame: localFrame, fps, config: SPRING_BOUNCY });
  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const isHighlighted = plan.highlighted;
  const glowFrame = Math.max(0, frame - delay);
  const glowPulse = pulse(glowFrame, 0.06);

  return (
    <div
      style={{
        flex: 1,
        maxWidth: 340,
        opacity,
        transform: `scale(${s}) ${isHighlighted ? "translateY(-12px)" : ""}`,
        transformOrigin: "top center",
        backgroundColor: isHighlighted ? "#0f1b2d" : "#0a1220",
        borderRadius: borderRadius["2xl"],
        border: isHighlighted
          ? `2px solid ${colors.primary[500]}`
          : plan.name === "Elite"
          ? "2px solid #a855f7"
          : `2px solid ${colors.gray[800]}`,
        padding: spacing[8],
        boxShadow: isHighlighted
          ? `0 0 ${32 * glowPulse}px ${colors.primary[500]}40, 0 8px 32px rgba(0,0,0,0.4)`
          : plan.name === "Elite"
          ? "0 8px 32px rgba(168, 85, 247, 0.15)"
          : "0 4px 16px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        gap: spacing[5],
        position: "relative",
      }}
    >
      {/* Recommended badge */}
      {isHighlighted && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Badge label="Recomendado" variant="success" />
        </div>
      )}

      {/* Plan name */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: fontSize["2xl"],
          fontWeight: fontWeight.bold,
          color: isHighlighted ? colors.primary[400] : plan.name === "Elite" ? "#c084fc" : colors.gray[300],
        }}
      >
        {plan.name}
      </div>

      {/* Price */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: fontSize["3xl"],
          fontWeight: fontWeight.bold,
          color: colors.white,
          lineHeight: 1,
        }}
      >
        {plan.price}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: colors.gray[700] }} />

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing[3], flex: 1 }}>
        {plan.features.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[3],
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: borderRadius.full,
                backgroundColor: isHighlighted
                  ? `${colors.primary[500]}30`
                  : plan.name === "Elite"
                  ? "rgba(168,85,247,0.2)"
                  : `${colors.gray[600]}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2.5 7L5.5 10L11.5 4"
                  stroke={
                    isHighlighted
                      ? colors.primary[400]
                      : plan.name === "Elite"
                      ? "#c084fc"
                      : colors.gray[400]
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.sm,
                color: colors.gray[300],
              }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PricingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.gray[950],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[10],
        padding: spacing[16],
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${colors.primary[900]}25, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          textAlign: "center" as const,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSize["4xl"],
            fontWeight: fontWeight.bold,
            color: colors.white,
            letterSpacing: "-0.02em",
          }}
        >
          Planos para cada momento
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.lg,
            color: colors.gray[400],
            marginTop: spacing[2],
          }}
        >
          Comece gratis, escale quando precisar
        </div>
      </div>

      {/* Plan cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: spacing[6],
          alignItems: "flex-start",
          paddingTop: spacing[6],
          position: "relative",
          width: "100%",
          maxWidth: 1100,
          justifyContent: "center",
        }}
      >
        {plans.map((plan, i) => (
          <OutroPlanCard
            key={plan.name}
            plan={plan}
            delay={20 + i * 30}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: CTA Scene (720-1020)
// ---------------------------------------------------------------------------

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main CTA springs in
  const ctaS = spring({ frame: Math.max(0, frame - 10), fps, config: SPRING_BOUNCY });
  const ctaOpacity = interpolate(Math.max(0, frame - 10), [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle fades in
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [40, 60], [16, 0], {
    extrapolateRight: "clamp",
  });

  // Button springs in
  const buttonS = spring({ frame: Math.max(0, frame - 60), fps, config: SPRING_BOUNCY });
  const buttonOpacity = interpolate(Math.max(0, frame - 60), [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // URL typewriter
  const urlText = "fittoday.com.br";
  const urlCharsToShow = Math.min(
    Math.floor(Math.max(0, frame - 100) * 1.5),
    urlText.length
  );
  const urlVisible = urlText.slice(0, urlCharsToShow);
  const urlOpacity = interpolate(frame, [100, 115], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Button glow pulse
  const glowPulse = pulse(frame, 0.07);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.gray[950],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[8],
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${colors.primary[900]}30, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Main CTA heading */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaS})`,
          textAlign: "center" as const,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSize["7xl"],
            fontWeight: fontWeight.bold,
            color: colors.white,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textShadow: `0 0 60px ${colors.primary[500]}40`,
          }}
        >
          Comece gratis agora
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          textAlign: "center" as const,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.xl,
            color: colors.gray[400],
            maxWidth: 600,
          }}
        >
          Sem cartao de credito. Sem compromisso. Cancele quando quiser.
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: buttonOpacity,
          transform: `scale(${buttonS})`,
          position: "relative",
        }}
      >
        <div
          style={{
            backgroundColor: colors.primary[500],
            borderRadius: borderRadius.full,
            paddingTop: spacing[5],
            paddingBottom: spacing[5],
            paddingLeft: 64,
            paddingRight: 64,
            boxShadow: `0 0 ${40 * glowPulse}px ${colors.primary[500]}60, 0 8px 32px rgba(0,0,0,0.4)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: fontSize["2xl"],
              fontWeight: fontWeight.bold,
              color: colors.white,
              letterSpacing: "0.01em",
            }}
          >
            Criar conta gratuita
          </span>
        </div>
      </div>

      {/* URL typewriter */}
      <div
        style={{
          opacity: urlOpacity,
          display: "flex",
          alignItems: "center",
          gap: spacing[2],
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize["2xl"],
            fontWeight: fontWeight.medium,
            color: colors.primary[400],
            letterSpacing: "0.05em",
            minWidth: 300,
            textAlign: "center" as const,
          }}
        >
          {urlVisible}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: fontSize["2xl"],
              backgroundColor: colors.primary[400],
              marginLeft: 3,
              opacity: Math.round(frame / 15) % 2 === 0 ? 1 : 0,
              borderRadius: 1,
              verticalAlign: "middle",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4: Outro 3D Scene (1020-1200)
// ---------------------------------------------------------------------------

// OutroScene handles its own timing internally from frame 0
// We wrap it in a Sequence so it starts fresh at the right time

// ---------------------------------------------------------------------------
// Main video composition
// ---------------------------------------------------------------------------

export const OutroVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Feature Montage (0-360) */}
      <Sequence from={0} durationInFrames={360}>
        <AbsoluteFill>
          <FeatureMontageScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Pricing Plans (360-720) */}
      <Sequence from={360} durationInFrames={360}>
        <AbsoluteFill>
          <PricingScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: CTA (720-1020) */}
      <Sequence from={720} durationInFrames={300}>
        <AbsoluteFill>
          <CTAScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: 3D Outro (1020-1200) */}
      <Sequence from={1020} durationInFrames={180}>
        <AbsoluteFill>
          <OutroScene />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
