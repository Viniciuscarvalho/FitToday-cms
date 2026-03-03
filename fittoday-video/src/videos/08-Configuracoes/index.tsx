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
import { AnimatedText } from "../../components/ui/AnimatedText";
import { Badge } from "../../components/ui/Badge";
import { CalloutBubble } from "../../components/annotations/CalloutBubble";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { plans, trainerProfile } from "../../utils/mockData";
import {
  fadeUpIn,
  springScale,
  stagger,
  fadeIn,
  SPRING_BOUNCY,
  SPRING_SNAPPY,
  SPRING_SMOOTH,
  pulse,
} from "../../utils/animations";

// ---------------------------------------------------------------------------
// Shared: Settings Tab Bar
// ---------------------------------------------------------------------------

type TabKey = "perfil" | "notificacoes" | "faturamento" | "seguranca";

const TAB_LABELS: { key: TabKey; label: string; icon: string }[] = [
  { key: "perfil", label: "Perfil", icon: "M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 14C7.58172 14 4 16.1421 4 18.5V20H20V18.5C20 16.1421 16.4183 14 12 14Z" },
  { key: "notificacoes", label: "Notificacoes", icon: "M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17C15 18.6569 13.6569 20 12 20C10.3431 20 9 18.6569 9 17M15 17H9" },
  { key: "faturamento", label: "Faturamento", icon: "M3 10H21M7 15H8M12 15H13M6 19H18C19.1046 19 20 18.1046 20 17V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V17C4 18.1046 4.89543 19 6 19Z" },
  { key: "seguranca", label: "Seguranca", icon: "M12 22C12 22 4 18 4 12V6L12 3L20 6V12C20 18 12 22 12 22Z" },
];

const SettingsTabBar: React.FC<{
  activeTab: TabKey;
  frame: number;
  fps: number;
  switchDelay?: number;
}> = ({ activeTab, frame, fps, switchDelay = 0 }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: spacing[1],
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.xl,
        padding: spacing[1],
        width: "fit-content",
        marginBottom: spacing[6],
      }}
    >
      {TAB_LABELS.map(({ key, label, icon }, i) => {
        const isActive = key === activeTab;
        const localFrame = Math.max(0, frame - (switchDelay + i * 8));
        const opacity = interpolate(localFrame, [0, 10], [0, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
              paddingTop: spacing[2],
              paddingBottom: spacing[2],
              paddingLeft: spacing[4],
              paddingRight: spacing[4],
              borderRadius: borderRadius.lg,
              backgroundColor: isActive ? colors.white : "transparent",
              boxShadow: isActive
                ? "0 1px 6px rgba(0,0,0,0.08)"
                : "none",
              opacity,
              transition: "background-color 0.2s",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive ? colors.primary[600] : colors.gray[500]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon} />
            </svg>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.sm,
                fontWeight: isActive ? fontWeight.semibold : fontWeight.medium,
                color: isActive ? colors.primary[700] : colors.gray[500],
                whiteSpace: "nowrap" as const,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 1: Tabs appear (0-150)
// ---------------------------------------------------------------------------

const TabsAppearScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <BrowserMockup>
      <CMSLayout activeItem="configuracoes">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <SettingsTabBar
            activeTab="perfil"
            frame={frame}
            fps={fps}
            switchDelay={10}
          />
          {/* Placeholder content area */}
          <div
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: `1px solid ${colors.gray[200]}`,
              ...fadeIn(frame, 40),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.base,
                color: colors.gray[400],
              }}
            >
              Carregando perfil...
            </span>
          </div>
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 2: Profile Tab (150-450)
// ---------------------------------------------------------------------------

const SpecialtyPill: React.FC<{ label: string; delay: number; frame: number; fps: number }> = ({
  label,
  delay,
  frame,
  fps,
}) => {
  const localFrame = Math.max(0, frame - delay);
  const s = spring({ frame: localFrame, fps, config: SPRING_BOUNCY });
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${s})`,
        transformOrigin: "center center",
        backgroundColor: colors.primary[50],
        border: `1px solid ${colors.primary[200]}`,
        borderRadius: borderRadius.full,
        paddingTop: spacing[2],
        paddingBottom: spacing[2],
        paddingLeft: spacing[4],
        paddingRight: spacing[4],
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          color: colors.primary[700],
        }}
      >
        {label}
      </span>
    </div>
  );
};

const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameText = "Carlos Silva";
  const bioText = "Personal trainer com 8 anos de experiencia";
  const instagramText = "@carlossilvapt";

  return (
    <BrowserMockup>
      <CMSLayout activeItem="configuracoes">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <SettingsTabBar activeTab="perfil" frame={frame} fps={fps} />

          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              padding: spacing[8],
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: `1px solid ${colors.gray[200]}`,
              display: "flex",
              flexDirection: "column",
              gap: spacing[6],
              flex: 1,
            }}
          >
            {/* Avatar row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[6],
                ...fadeUpIn(frame, 10),
              }}
            >
              {/* Avatar circle */}
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: borderRadius.full,
                    background: `linear-gradient(135deg, ${colors.primary[400]}, ${colors.primary[600]})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 14px ${colors.primary[500]}40`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: fontSize["2xl"],
                      fontWeight: fontWeight.bold,
                      color: colors.white,
                    }}
                  >
                    CS
                  </span>
                </div>
                {/* Camera icon overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 26,
                    height: 26,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.gray[800],
                    border: `2px solid ${colors.white}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.bold,
                    color: colors.gray[900],
                  }}
                >
                  Foto de Perfil
                </div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: fontSize.sm,
                    color: colors.gray[500],
                  }}
                >
                  JPG, PNG ou GIF. Maximo 2MB.
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
              }}
            >
              {/* Nome field */}
              <div style={fadeUpIn(frame, 25)}>
                <label
                  style={{
                    fontFamily: fonts.body,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.gray[700],
                    display: "block",
                    marginBottom: spacing[2],
                  }}
                >
                  Nome
                </label>
                <div
                  style={{
                    border: `2px solid ${colors.primary[400]}`,
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[3]}px ${spacing[4]}px`,
                    backgroundColor: colors.white,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <AnimatedText
                    text={nameText}
                    mode="typewriter"
                    delay={30}
                    fontSize={fontSize.base}
                    color={colors.gray[900]}
                  />
                </div>
              </div>

              {/* Bio field */}
              <div style={fadeUpIn(frame, 45)}>
                <label
                  style={{
                    fontFamily: fonts.body,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.gray[700],
                    display: "block",
                    marginBottom: spacing[2],
                  }}
                >
                  Bio
                </label>
                <div
                  style={{
                    border: `2px solid ${colors.gray[300]}`,
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[3]}px ${spacing[4]}px`,
                    backgroundColor: colors.white,
                    minHeight: 60,
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  <AnimatedText
                    text={bioText}
                    mode="typewriter"
                    delay={80}
                    fontSize={fontSize.sm}
                    color={colors.gray[700]}
                  />
                </div>
              </div>

              {/* Specialties */}
              <div style={fadeUpIn(frame, 65)}>
                <label
                  style={{
                    fontFamily: fonts.body,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.gray[700],
                    display: "block",
                    marginBottom: spacing[2],
                  }}
                >
                  Especialidades
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap" as const,
                    gap: spacing[2],
                  }}
                >
                  {trainerProfile.specialties.map((s, i) => (
                    <SpecialtyPill
                      key={s}
                      label={s}
                      delay={100 + i * 15}
                      frame={frame}
                      fps={fps}
                    />
                  ))}
                </div>
              </div>

              {/* Instagram */}
              <div style={fadeUpIn(frame, 90)}>
                <label
                  style={{
                    fontFamily: fonts.body,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.gray[700],
                    display: "block",
                    marginBottom: spacing[2],
                  }}
                >
                  Instagram
                </label>
                <div
                  style={{
                    border: `2px solid ${colors.gray[300]}`,
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[3]}px ${spacing[4]}px`,
                    backgroundColor: colors.white,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <AnimatedText
                    text={instagramText}
                    mode="typewriter"
                    delay={160}
                    fontSize={fontSize.base}
                    color={colors.gray[700]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Callout */}
          <CalloutBubble
            text="Personalize seu perfil profissional"
            x={960}
            y={100}
            delay={220}
            direction="bottom"
            holdFrames={80}
          />
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: Notifications Tab (450-750)
// ---------------------------------------------------------------------------

const ToggleSwitch: React.FC<{
  label: string;
  channel: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ label, channel, delay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(localFrame, [0, 12], [-16, 0], {
    extrapolateRight: "clamp",
  });

  // Toggle animates from OFF to ON
  const toggleProgress = spring({
    frame: Math.max(0, localFrame - 15),
    fps,
    config: SPRING_SNAPPY,
  });
  const knobX = interpolate(toggleProgress, [0, 1], [2, 22]);
  const trackColor = interpolate(
    toggleProgress,
    [0, 1],
    0 as any,
    1 as any
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${spacing[4]}px 0`,
        borderBottom: `1px solid ${colors.gray[100]}`,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: colors.gray[800],
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.xs,
            color: colors.gray[400],
          }}
        >
          {channel}
        </div>
      </div>

      {/* Toggle */}
      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: borderRadius.full,
          backgroundColor: toggleProgress > 0.5 ? colors.primary[500] : colors.gray[300],
          position: "relative",
          flexShrink: 0,
          boxShadow:
            toggleProgress > 0.5
              ? `0 0 8px ${colors.primary[500]}60`
              : "none",
          transition: "background-color 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: knobX,
            width: 20,
            height: 20,
            borderRadius: borderRadius.full,
            backgroundColor: colors.white,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </div>
  );
};

const NotificationsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const notifications = [
    { label: "Novo aluno", channel: "Email" },
    { label: "Check-in semanal", channel: "Email" },
    { label: "Novo aluno", channel: "Push" },
    { label: "Mensagens", channel: "Push" },
  ];

  return (
    <BrowserMockup>
      <CMSLayout activeItem="configuracoes">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <SettingsTabBar activeTab="notificacoes" frame={frame} fps={fps} />

          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              padding: spacing[8],
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: `1px solid ${colors.gray[200]}`,
              flex: 1,
            }}
          >
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.gray[900],
                marginBottom: spacing[6],
                ...fadeUpIn(frame, 5),
              }}
            >
              Preferencias de Notificacao
            </div>

            <div>
              {notifications.map((n, i) => (
                <ToggleSwitch
                  key={`${n.label}-${n.channel}`}
                  label={n.label}
                  channel={n.channel}
                  delay={stagger(i, 20, 18)}
                  frame={frame}
                  fps={fps}
                />
              ))}
            </div>
          </div>
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 4: Billing / Plans Tab (750-1050)
// ---------------------------------------------------------------------------

const PlanCard: React.FC<{
  plan: typeof plans[number];
  delay: number;
  frame: number;
  fps: number;
}> = ({ plan, delay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay);
  const s = spring({ frame: localFrame, fps, config: SPRING_BOUNCY });
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const isHighlighted = plan.highlighted;

  const borderStyle = isHighlighted
    ? `2px solid ${colors.primary[500]}`
    : plan.name === "Elite"
    ? "2px solid transparent"
    : `2px solid ${colors.gray[200]}`;

  const cardBg = isHighlighted
    ? colors.white
    : plan.name === "Elite"
    ? "#faf5ff"
    : colors.white;

  return (
    <div
      style={{
        flex: 1,
        opacity,
        transform: `scale(${s}) ${isHighlighted ? "translateY(-8px)" : ""}`,
        transformOrigin: "top center",
        backgroundColor: cardBg,
        borderRadius: borderRadius.xl,
        border: borderStyle,
        background:
          plan.name === "Elite"
            ? "linear-gradient(white, white) padding-box, linear-gradient(135deg, #a855f7, #d946ef) border-box"
            : undefined,
        padding: spacing[6],
        boxShadow: isHighlighted
          ? `0 8px 32px ${colors.primary[500]}30`
          : "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: spacing[4],
        position: "relative",
      }}
    >
      {/* Recommended badge */}
      {isHighlighted && (
        <div
          style={{
            position: "absolute",
            top: -12,
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
          fontSize: fontSize.xl,
          fontWeight: fontWeight.bold,
          color: isHighlighted ? colors.primary[700] : colors.gray[900],
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
          color: isHighlighted ? colors.primary[600] : colors.gray[800],
          lineHeight: 1,
        }}
      >
        {plan.price}
      </div>

      {/* Features */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing[3],
          flex: 1,
        }}
      >
        {plan.features.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing[2],
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M2.5 7L5.5 10L11.5 4"
                stroke={isHighlighted ? colors.primary[500] : colors.gray[400]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.sm,
                color: colors.gray[700],
              }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <div
        style={{
          backgroundColor: isHighlighted ? colors.primary[500] : colors.gray[100],
          borderRadius: borderRadius.lg,
          padding: `${spacing[3]}px ${spacing[6]}px`,
          textAlign: "center" as const,
          boxShadow: isHighlighted
            ? `0 4px 14px ${colors.primary[500]}40`
            : "none",
        }}
      >
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: isHighlighted ? colors.white : colors.gray[600],
          }}
        >
          {isHighlighted ? "Plano atual" : "Selecionar"}
        </span>
      </div>
    </div>
  );
};

const BillingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <BrowserMockup>
      <CMSLayout activeItem="configuracoes">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <SettingsTabBar activeTab="faturamento" frame={frame} fps={fps} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[6],
              flex: 1,
            }}
          >
            <div style={fadeUpIn(frame, 5)}>
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  color: colors.gray[900],
                }}
              >
                Escolha seu plano
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: spacing[5],
                flex: 1,
                alignItems: "stretch",
                paddingTop: spacing[4],
              }}
            >
              {plans.map((plan, i) => (
                <PlanCard
                  key={plan.name}
                  plan={plan}
                  delay={stagger(i, 20, 25)}
                  frame={frame}
                  fps={fps}
                />
              ))}
            </div>
          </div>
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 5: Security Tab (1050-1350)
// ---------------------------------------------------------------------------

const SecurityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade to black near end
  const fadeOutOpacity = interpolate(
    frame,
    [260, 300],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const sessions = [
    { device: "MacBook Pro", location: "Sao Paulo, SP", time: "Agora", isCurrent: true },
    { device: "iPhone 15 Pro", location: "Sao Paulo, SP", time: "2 horas atras", isCurrent: false },
  ];

  return (
    <AbsoluteFill style={{ opacity: fadeOutOpacity }}>
      <BrowserMockup>
        <CMSLayout activeItem="configuracoes">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <SettingsTabBar activeTab="seguranca" frame={frame} fps={fps} />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[5],
                flex: 1,
              }}
            >
              {/* Password section */}
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.xl,
                  padding: spacing[6],
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: `1px solid ${colors.gray[200]}`,
                  ...fadeUpIn(frame, 10),
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.bold,
                    color: colors.gray[900],
                    marginBottom: spacing[4],
                  }}
                >
                  Alterar Senha
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: spacing[4],
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      border: `2px solid ${colors.gray[300]}`,
                      borderRadius: borderRadius.lg,
                      padding: `${spacing[3]}px ${spacing[4]}px`,
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[2],
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 20,
                        color: colors.gray[400],
                        letterSpacing: 6,
                      }}
                    >
                      ••••••••
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: colors.gray[800],
                      borderRadius: borderRadius.lg,
                      paddingTop: spacing[3],
                      paddingBottom: spacing[3],
                      paddingLeft: spacing[5],
                      paddingRight: spacing[5],
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: fontSize.sm,
                        fontWeight: fontWeight.semibold,
                        color: colors.white,
                      }}
                    >
                      Alterar Senha
                    </span>
                  </div>
                </div>
              </div>

              {/* Two-factor auth */}
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.xl,
                  padding: spacing[6],
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: `1px solid ${colors.gray[200]}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  ...fadeUpIn(frame, 40),
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.base,
                      fontWeight: fontWeight.semibold,
                      color: colors.gray[800],
                    }}
                  >
                    Autenticacao de dois fatores
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.sm,
                      color: colors.gray[500],
                    }}
                  >
                    Adicione uma camada extra de seguranca
                  </div>
                </div>
                {/* Toggle ON */}
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.primary[500],
                    position: "relative",
                    boxShadow: `0 0 8px ${colors.primary[500]}60`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 22,
                      width: 20,
                      height: 20,
                      borderRadius: borderRadius.full,
                      backgroundColor: colors.white,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>

              {/* Active sessions */}
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.xl,
                  padding: spacing[6],
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: `1px solid ${colors.gray[200]}`,
                  ...fadeUpIn(frame, 70),
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.bold,
                    color: colors.gray[900],
                    marginBottom: spacing[4],
                  }}
                >
                  Sessoes Ativas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                  {sessions.map((session, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[4],
                        padding: `${spacing[3]}px 0`,
                        borderBottom: i < sessions.length - 1 ? `1px solid ${colors.gray[100]}` : "none",
                        ...fadeUpIn(frame, 90 + i * 20),
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: borderRadius.lg,
                          backgroundColor: colors.gray[100],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.gray[500]} strokeWidth="2" strokeLinecap="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: fonts.body,
                            fontSize: fontSize.sm,
                            fontWeight: fontWeight.semibold,
                            color: colors.gray[800],
                          }}
                        >
                          {session.device}
                        </div>
                        <div
                          style={{
                            fontFamily: fonts.body,
                            fontSize: fontSize.xs,
                            color: colors.gray[400],
                          }}
                        >
                          {session.location} — {session.time}
                        </div>
                      </div>
                      {session.isCurrent ? (
                        <Badge label="Atual" variant="success" />
                      ) : (
                        <Badge label="Encerrar" variant="error" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main video composition
// ---------------------------------------------------------------------------

export const ConfiguracoesVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Tabs appear (0-150) */}
      <Sequence from={0} durationInFrames={150}>
        <AbsoluteFill>
          <TabsAppearScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Profile tab (150-450) */}
      <Sequence from={150} durationInFrames={300}>
        <AbsoluteFill>
          <ProfileScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Notifications tab (450-750) */}
      <Sequence from={450} durationInFrames={300}>
        <AbsoluteFill>
          <NotificationsScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: Billing/Plans tab (750-1050) */}
      <Sequence from={750} durationInFrames={300}>
        <AbsoluteFill>
          <BillingScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 5: Security tab (1050-1350) */}
      <Sequence from={1050} durationInFrames={300}>
        <AbsoluteFill>
          <SecurityScene />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
