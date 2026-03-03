import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { BrowserMockup } from "../../components/layout/BrowserMockup";
import { CMSLayout } from "../../components/layout/CMSLayout";
import { StatCard } from "../../components/ui/StatCard";
import { CalloutBubble } from "../../components/annotations/CalloutBubble";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { mockRecentActivity } from "../../utils/mockData";
import { fadeUpIn, fadeIn, fadeOut, stagger, springScale } from "../../utils/animations";

// ---------------------------------------------------------------------------
// Shared background wrapper
// ---------------------------------------------------------------------------

const DashboardBackground: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: colors.gray[100],
      display: "flex",
      alignItems: "stretch",
    }}
  >
    {children}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Scene 1 — Browser + CMSLayout appearing (0-150)
// ---------------------------------------------------------------------------

const SceneAppear: React.FC = () => {
  return (
    <DashboardBackground>
      <BrowserMockup>
        <CMSLayout activeItem="dashboard">
          {/* Empty content — layout itself is the star */}
          <div style={{ flex: 1 }} />
        </CMSLayout>
      </BrowserMockup>
    </DashboardBackground>
  );
};

// ---------------------------------------------------------------------------
// Activity icon helper
// ---------------------------------------------------------------------------

const ActivityIcon: React.FC<{
  type: "dollar" | "check" | "star";
  size?: number;
}> = ({ type, size = 18 }) => {
  if (type === "dollar") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="23"
          stroke={colors.success}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          stroke={colors.success}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "check") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke={colors.primary[500]}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // star
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        stroke={colors.warning}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={colors.warning}
        fillOpacity={0.25}
      />
    </svg>
  );
};

const iconBgColors: Record<string, string> = {
  dollar: "rgba(34, 197, 94, 0.12)",
  check: "rgba(16, 185, 129, 0.12)",
  star: "rgba(245, 158, 11, 0.12)",
};

// ---------------------------------------------------------------------------
// Scene 2 — Stat cards + callout (150-600)
// ---------------------------------------------------------------------------

const SceneStatCards: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <DashboardBackground>
      <BrowserMockup>
        <CMSLayout activeItem="dashboard">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[6],
              height: "100%",
            }}
          >
            {/* 4-column stat card grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: spacing[5],
              }}
            >
              <StatCard
                title="Alunos Ativos"
                value={24}
                prefix=""
                gradientColors={colors.statGradients.students}
                icon="users"
                delay={0}
              />
              <StatCard
                title="Treinos Ativos"
                value={8}
                prefix=""
                gradientColors={colors.statGradients.programs}
                icon="dumbbell"
                delay={stagger(1, 0, 18)}
              />
              <StatCard
                title="Receita do Mes"
                value={4850}
                prefix="R$ "
                change={12.5}
                gradientColors={colors.statGradients.revenue}
                icon="dollar"
                delay={stagger(2, 0, 18)}
              />
              <StatCard
                title="Nota Media"
                value={4}
                prefix=""
                suffix=".8"
                gradientColors={colors.statGradients.rating}
                icon="star"
                delay={stagger(3, 0, 18)}
              />
            </div>

            {/* Placeholder lower content */}
            <div
              style={{
                flex: 1,
                borderRadius: borderRadius["2xl"],
                backgroundColor: colors.white,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                ...fadeUpIn(frame, 80),
              }}
            />
          </div>
        </CMSLayout>
      </BrowserMockup>

      {/* Callout annotation — appears at frame 120 inside this sequence */}
      <CalloutBubble
        text="Acompanhe seus KPIs em tempo real"
        x={960}
        y={260}
        delay={120}
        direction="bottom"
        holdFrames={200}
      />
    </DashboardBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Recent activity (600-1050)
// ---------------------------------------------------------------------------

const SceneRecentActivity: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <DashboardBackground>
      <BrowserMockup>
        <CMSLayout activeItem="dashboard">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[6],
              height: "100%",
            }}
          >
            {/* Section title */}
            <div
              style={{
                ...fadeUpIn(frame, 10),
                fontFamily: fonts.display,
                fontSize: fontSize["2xl"],
                fontWeight: fontWeight.bold,
                color: colors.gray[900],
              }}
            >
              Atividade Recente
            </div>

            {/* Activity items */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
              }}
            >
              {mockRecentActivity.map((item, i) => {
                const delay = stagger(i, 20, 30);
                const anim = fadeUpIn(frame, delay);

                const slideX = interpolate(
                  Math.max(0, frame - delay),
                  [0, 18],
                  [-40, 0],
                  { extrapolateRight: "clamp" }
                );

                return (
                  <div
                    key={i}
                    style={{
                      ...anim,
                      transform: `translateX(${slideX}px)`,
                      backgroundColor: colors.white,
                      borderRadius: borderRadius["2xl"],
                      padding: spacing[5],
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[4],
                      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                    }}
                  >
                    {/* Icon circle */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: borderRadius.full,
                        backgroundColor: iconBgColors[item.icon],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ActivityIcon type={item.icon} size={22} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: fonts.body,
                          fontSize: fontSize.base,
                          fontWeight: fontWeight.semibold,
                          color: colors.gray[800],
                          marginBottom: 4,
                        }}
                      >
                        {item.text}
                      </div>
                      <div
                        style={{
                          fontFamily: fonts.body,
                          fontSize: fontSize.sm,
                          color: colors.gray[500],
                        }}
                      >
                        {item.detail}
                      </div>
                    </div>

                    {/* Time badge */}
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: fontSize.xs,
                        fontWeight: fontWeight.medium,
                        color: colors.gray[400],
                        whiteSpace: "nowrap" as const,
                        backgroundColor: colors.gray[100],
                        borderRadius: borderRadius.full,
                        paddingLeft: spacing[3],
                        paddingRight: spacing[3],
                        paddingTop: 4,
                        paddingBottom: 4,
                      }}
                    >
                      {item.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </DashboardBackground>
  );
};

// ---------------------------------------------------------------------------
// Quick action button component
// ---------------------------------------------------------------------------

interface QuickActionBtnProps {
  label: string;
  description: string;
  gradient: [string, string];
  delay: number;
  highlighted?: boolean;
}

const QuickActionBtn: React.FC<QuickActionBtnProps> = ({
  label,
  description,
  gradient,
  delay,
  highlighted = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleS = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 14, stiffness: 200 },
  });

  const anim = fadeUpIn(frame, delay);

  const glowPulse = highlighted
    ? 0.7 + Math.sin(frame * 0.15) * 0.3
    : 0;

  return (
    <div
      style={{
        ...anim,
        transform: `scale(${scaleS})`,
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        borderRadius: borderRadius["2xl"],
        padding: spacing[5],
        display: "flex",
        flexDirection: "column",
        gap: spacing[2],
        boxShadow: highlighted
          ? `0 8px 32px ${gradient[0]}${Math.round(glowPulse * 128).toString(16).padStart(2, "0")}, 0 4px 16px rgba(0,0,0,0.18)`
          : "0 4px 20px rgba(0,0,0,0.14)",
        border: highlighted
          ? `2px solid ${colors.white}40`
          : "2px solid transparent",
        cursor: "pointer",
        flex: 1,
      }}
    >
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: fontSize.xl,
          fontWeight: fontWeight.bold,
          color: colors.white,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.normal,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        {description}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Quick actions (1050-1350)
// ---------------------------------------------------------------------------

const SceneQuickActions: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <DashboardBackground>
      <BrowserMockup>
        <CMSLayout activeItem="dashboard">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[6],
              height: "100%",
            }}
          >
            {/* Section title */}
            <div
              style={{
                ...fadeUpIn(frame, 10),
                fontFamily: fonts.display,
                fontSize: fontSize["2xl"],
                fontWeight: fontWeight.bold,
                color: colors.gray[900],
              }}
            >
              Acoes Rapidas
            </div>

            {/* Dark card container */}
            <div
              style={{
                ...fadeUpIn(frame, 20),
                backgroundColor: colors.gray[900],
                borderRadius: borderRadius["2xl"],
                padding: spacing[6],
                display: "flex",
                flexDirection: "row",
                gap: spacing[5],
              }}
            >
              <QuickActionBtn
                label="Novo Programa"
                description="Crie um programa de treino agora"
                gradient={[colors.primary[500], colors.teal[500]]}
                delay={30}
                highlighted={true}
              />
              <QuickActionBtn
                label="Adicionar Aluno"
                description="Convide um novo aluno para sua plataforma"
                gradient={[colors.statGradients.students[0], colors.statGradients.students[1]]}
                delay={50}
              />
              <QuickActionBtn
                label="Ver Relatorio"
                description="Analise o desempenho do mes"
                gradient={[colors.statGradients.revenue[0], colors.statGradients.revenue[1]]}
                delay={70}
              />
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </DashboardBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Fade to black (1350-1500)
// ---------------------------------------------------------------------------

const SceneFadeOut: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 60], [1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950], opacity }} />
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const DashboardVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Layout appears (0-150) */}
      <Sequence from={0} durationInFrames={150}>
        <SceneAppear />
      </Sequence>

      {/* Scene 2: Stat cards + callout (150-600) */}
      <Sequence from={150} durationInFrames={450}>
        <SceneStatCards />
      </Sequence>

      {/* Scene 3: Recent activity (600-1050) */}
      <Sequence from={600} durationInFrames={450}>
        <SceneRecentActivity />
      </Sequence>

      {/* Scene 4: Quick actions (1050-1350) */}
      <Sequence from={1050} durationInFrames={300}>
        <SceneQuickActions />
      </Sequence>

      {/* Scene 5: Fade to black (1350-1500) */}
      <Sequence from={1350} durationInFrames={150}>
        <SceneFadeOut />
      </Sequence>
    </AbsoluteFill>
  );
};
