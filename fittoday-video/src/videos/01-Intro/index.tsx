import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { IntroScene } from "../../components/3d/IntroScene";
import { BrowserMockup } from "../../components/layout/BrowserMockup";
import { CMSLayout } from "../../components/layout/CMSLayout";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing } from "../../theme/spacing";
import { fadeIn, fadeOut, fadeUpIn, stagger } from "../../utils/animations";

// ---------------------------------------------------------------------------
// Scene 2 — Brand subtitle + features typing in
// ---------------------------------------------------------------------------

const FEATURES = [
  "Gerencie seus alunos com facilidade",
  "Crie programas de treino profissionais",
  "Acompanhe metricas em tempo real",
  "Receba pagamentos automaticamente",
  "Comunique-se com seus alunos",
  "Faca a plataforma crescer com voce",
];

const BrandSubtitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleAnim = fadeUpIn(frame, 10);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.gray[950],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[8],
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${colors.primary[900]}22, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Headline */}
      <div
        style={{
          ...titleAnim,
          fontFamily: fonts.display,
          fontSize: fontSize["4xl"],
          fontWeight: fontWeight.bold,
          color: colors.white,
          textAlign: "center",
          letterSpacing: "-0.02em",
          position: "relative",
          zIndex: 1,
        }}
      >
        Tudo que voce precisa para{" "}
        <span style={{ color: colors.primary[400] }}>crescer</span>
      </div>

      {/* Features list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing[3],
          position: "relative",
          zIndex: 1,
        }}
      >
        {FEATURES.map((feature, i) => {
          const delay = 20 + i * 22;
          const anim = fadeUpIn(frame, delay);
          return (
            <div
              key={feature}
              style={{
                ...anim,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: spacing[3],
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor: colors.primary[400],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.medium,
                  color: colors.gray[200],
                  letterSpacing: "0.01em",
                }}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Mini mockup — a single CMS page thumbnail for the montage
// ---------------------------------------------------------------------------

interface MiniMockupProps {
  activeItem: string;
  label: string;
  durationInScene: number;
}

const MiniMockup: React.FC<MiniMockupProps> = ({
  activeItem,
  label,
  durationInScene,
}) => {
  const frame = useCurrentFrame();

  const fadeInOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOutOpacity = interpolate(
    frame,
    [durationInScene - 20, durationInScene],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  const scaleIn = interpolate(frame, [0, 25], [0.95, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.gray[900],
        opacity,
        transform: `scale(${scaleIn})`,
      }}
    >
      {/* Label overlay */}
      <div
        style={{
          position: "absolute",
          top: spacing[8],
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          backgroundColor: colors.primary[500],
          borderRadius: 9999,
          paddingLeft: spacing[5],
          paddingRight: spacing[5],
          paddingTop: spacing[2],
          paddingBottom: spacing[2],
          fontFamily: fonts.body,
          fontSize: fontSize.lg,
          fontWeight: fontWeight.semibold,
          color: colors.white,
          letterSpacing: "0.04em",
          textTransform: "uppercase" as const,
          boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
          opacity: interpolate(frame, [15, 30], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        {label}
      </div>

      {/* Browser mockup scaled down */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing[12],
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <BrowserMockup>
            <CMSLayout activeItem={activeItem}>
              {/* Placeholder content for each mini-page */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing[4],
                  height: "100%",
                }}
              >
                {/* Row of fake stat blocks */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: spacing[4],
                  }}
                >
                  {[colors.statGradients.students, colors.statGradients.programs, colors.statGradients.revenue, colors.statGradients.rating].map(
                    (grad, idx) => (
                      <div
                        key={idx}
                        style={{
                          height: 80,
                          borderRadius: 16,
                          background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                          opacity: interpolate(frame, [10 + idx * 8, 25 + idx * 8], [0, 1], {
                            extrapolateRight: "clamp",
                          }),
                        }}
                      />
                    )
                  )}
                </div>

                {/* Fake content rows */}
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      height: 56,
                      borderRadius: 12,
                      backgroundColor: colors.white,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      opacity: interpolate(frame, [20 + idx * 10, 35 + idx * 10], [0, 1], {
                        extrapolateRight: "clamp",
                      }),
                    }}
                  />
                ))}
              </div>
            </CMSLayout>
          </BrowserMockup>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Montage scene — 6 mini mockups cycling through
// ---------------------------------------------------------------------------

const MONTAGE_PAGES = [
  { activeItem: "dashboard", label: "Dashboard" },
  { activeItem: "treinos", label: "Treinos" },
  { activeItem: "alunos", label: "Alunos" },
  { activeItem: "mensagens", label: "Mensagens" },
  { activeItem: "analytics", label: "Analytics" },
  { activeItem: "financeiro", label: "Financeiro" },
];

const FRAMES_PER_PAGE = 140;

const MontageScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {MONTAGE_PAGES.map((page, i) => (
        <Sequence
          key={page.activeItem}
          from={i * FRAMES_PER_PAGE}
          durationInFrames={FRAMES_PER_PAGE}
        >
          <MiniMockup
            activeItem={page.activeItem}
            label={page.label}
            durationInScene={FRAMES_PER_PAGE}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Call to action
// ---------------------------------------------------------------------------

const CallToActionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });

  const fadeOutOp = fadeOut(frame, 120, 30);

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
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
        gap: spacing[6],
        opacity: bgOpacity,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 50% 40% at 50% 55%, ${colors.primary[800]}44, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          ...fadeOutOp,
          transform: `scale(${scaleSpring})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: spacing[6],
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Big text */}
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSize["6xl"],
            fontWeight: fontWeight.bold,
            color: colors.white,
            letterSpacing: "-0.03em",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Vamos{" "}
          <span
            style={{
              color: colors.primary[400],
              display: "inline-block",
            }}
          >
            comecar!
          </span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize["2xl"],
            fontWeight: fontWeight.medium,
            color: colors.gray[400],
            textAlign: "center",
          }}
        >
          Assista ao tutorial completo
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const IntroVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: 3D intro logo (0-180) */}
      <Sequence from={0} durationInFrames={180}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Brand subtitle + features (180-360) */}
      <Sequence from={180} durationInFrames={180}>
        <BrandSubtitleScene />
      </Sequence>

      {/* Scene 3: Montage of 6 CMS pages (360-1200) */}
      <Sequence from={360} durationInFrames={840}>
        <MontageScene />
      </Sequence>

      {/* Scene 4: Call to action (1200-1350) */}
      <Sequence from={1200} durationInFrames={150}>
        <CallToActionScene />
      </Sequence>
    </AbsoluteFill>
  );
};
