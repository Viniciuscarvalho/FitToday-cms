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
import { ProgramCard } from "../../components/ui/ProgramCard";
import { AnimatedText } from "../../components/ui/AnimatedText";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { StepIndicator } from "../../components/annotations/StepIndicator";
import { HighlightRing } from "../../components/annotations/HighlightRing";
import { CalloutBubble } from "../../components/annotations/CalloutBubble";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { mockPrograms, mockExercises } from "../../utils/mockData";
import { fadeUpIn, fadeIn, fadeOut, stagger, springScale } from "../../utils/animations";

// ---------------------------------------------------------------------------
// Shared layout wrapper
// ---------------------------------------------------------------------------

const TreinosBackground: React.FC<{ children: React.ReactNode }> = ({
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
// Scene 1 — Programs grid (0-300)
// ---------------------------------------------------------------------------

const SceneProgramGrid: React.FC = () => {
  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: spacing[5],
              height: "100%",
              alignContent: "start",
            }}
          >
            {mockPrograms.map((program, i) => (
              <ProgramCard
                key={program.title}
                title={program.title}
                status={program.status}
                weeks={program.weeks}
                daysPerWeek={program.daysPerWeek}
                students={program.students}
                price={program.price}
                rating={program.rating}
                delay={stagger(i, 10, 20)}
              />
            ))}
          </div>
        </CMSLayout>
      </BrowserMockup>
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Highlight on "Novo Programa" button (300-450)
// ---------------------------------------------------------------------------

const SceneHighlightButton: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[5],
              height: "100%",
            }}
          >
            {/* Top action bar with "Novo Programa" button */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                ...fadeUpIn(frame, 5),
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  color: colors.gray[900],
                }}
              >
                Meus Programas
              </div>

              {/* The button being highlighted */}
              <div
                id="novo-programa-btn"
                style={{
                  backgroundColor: colors.primary[500],
                  borderRadius: borderRadius.lg,
                  paddingLeft: spacing[5],
                  paddingRight: spacing[5],
                  paddingTop: spacing[3],
                  paddingBottom: spacing[3],
                  fontFamily: fonts.body,
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.semibold,
                  color: colors.white,
                  cursor: "pointer",
                }}
              >
                + Novo Programa
              </div>
            </div>

            {/* Program cards dimmed */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: spacing[5],
                opacity: interpolate(frame, [0, 20], [0.4, 0.25], {
                  extrapolateRight: "clamp",
                }),
                flex: 1,
                alignContent: "start",
              }}
            >
              {mockPrograms.slice(0, 3).map((program, i) => (
                <ProgramCard
                  key={program.title}
                  title={program.title}
                  status={program.status}
                  weeks={program.weeks}
                  daysPerWeek={program.daysPerWeek}
                  students={program.students}
                  price={program.price}
                  rating={program.rating}
                  delay={0}
                />
              ))}
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>

      {/* Highlight ring positioned over the button area (top-right of content area) */}
      <HighlightRing
        x={1550}
        y={182}
        width={200}
        height={48}
        delay={20}
        color={colors.primary[400]}
        holdFrames={120}
      />

      {/* Callout */}
      <CalloutBubble
        text="Clique para criar um novo programa"
        x={1550}
        y={110}
        delay={35}
        direction="bottom"
        holdFrames={100}
      />
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Wizard form field helpers
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  delay?: number;
}

const FormField: React.FC<FormFieldProps> = ({ label, children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const anim = fadeUpIn(frame, delay);

  return (
    <div style={{ ...anim, display: "flex", flexDirection: "column", gap: spacing[2] }}>
      <label
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          color: colors.gray[600],
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: borderRadius.lg,
  border: `2px solid ${colors.primary[400]}`,
  backgroundColor: colors.white,
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
  fontFamily: fonts.body,
  fontSize: fontSize.base,
  fontWeight: fontWeight.normal,
  color: colors.gray[800],
  outline: "none",
  boxSizing: "border-box" as const,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundColor: colors.white,
  cursor: "pointer",
  border: `2px solid ${colors.gray[200]}`,
};

// ---------------------------------------------------------------------------
// Difficulty selector
// ---------------------------------------------------------------------------

const DifficultySelector: React.FC<{ selected: string }> = ({ selected }) => {
  const options = ["Iniciante", "Intermediario", "Avancado"];
  const gradients: Record<string, [string, string]> = {
    Iniciante: [colors.success, "#16a34a"],
    Intermediario: [colors.warning, "#d97706"],
    Avancado: [colors.error, "#dc2626"],
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: spacing[3] }}>
      {options.map((opt) => {
        const isSelected = opt === selected;
        const grad = gradients[opt];
        return (
          <div
            key={opt}
            style={{
              flex: 1,
              height: 44,
              borderRadius: borderRadius.lg,
              background: isSelected
                ? `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`
                : colors.gray[100],
              border: isSelected
                ? `2px solid ${grad[0]}`
                : `2px solid ${colors.gray[200]}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.body,
              fontSize: fontSize.sm,
              fontWeight: isSelected ? fontWeight.semibold : fontWeight.normal,
              color: isSelected ? colors.white : colors.gray[500],
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Wizard step 1: Info (450-720)
// ---------------------------------------------------------------------------

const SceneWizardStep1: React.FC = () => {
  const frame = useCurrentFrame();

  // Typewriter for name field starts at frame 30
  const nameText = "Treino Forca Total";
  const nameChars = Math.min(
    Math.floor(Math.max(0, frame - 30) * 1.5),
    nameText.length
  );
  const visibleName = nameText.slice(0, nameChars);
  const showCursor = nameChars < nameText.length || Math.floor(frame / 15) % 2 === 0;

  // Category dropdown appears after name is typed
  const categoryDelay = 80;
  const categoryAnim = fadeUpIn(frame, categoryDelay);

  // Difficulty appears after category
  const difficultyDelay = 120;
  const difficultyAnim = fadeUpIn(frame, difficultyDelay);

  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing[8],
              padding: spacing[6],
              height: "100%",
            }}
          >
            {/* Step indicator */}
            <StepIndicator current={1} total={5} delay={5} />

            {/* Wizard card */}
            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius["2xl"],
                padding: spacing[8],
                width: "100%",
                maxWidth: 720,
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                gap: spacing[6],
                ...fadeUpIn(frame, 10),
              }}
            >
              {/* Card title */}
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  color: colors.gray[900],
                }}
              >
                Informacoes do Programa
              </div>

              {/* Name field */}
              <FormField label="Nome do Programa" delay={15}>
                <div style={{ position: "relative" }}>
                  <div style={inputStyle}>
                    <span>{visibleName}</span>
                    {showCursor && nameChars <= nameText.length && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 2,
                          height: "1em",
                          backgroundColor: colors.primary[500],
                          marginLeft: 1,
                          verticalAlign: "text-bottom",
                        }}
                      />
                    )}
                  </div>
                </div>
              </FormField>

              {/* Category dropdown */}
              <div style={categoryAnim}>
                <FormField label="Categoria" delay={0}>
                  <div
                    style={{
                      ...selectStyle,
                      display: "flex",
                      alignItems: "center",
                      paddingRight: spacing[8],
                      position: "relative",
                    }}
                  >
                    <span style={{ color: colors.gray[700] }}>Musculacao</span>
                    <svg
                      style={{
                        position: "absolute",
                        right: spacing[3],
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.5,
                      }}
                      width={16}
                      height={16}
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke={colors.gray[600]}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </FormField>
              </div>

              {/* Difficulty selector */}
              <div style={difficultyAnim}>
                <FormField label="Nivel de Dificuldade" delay={0}>
                  <DifficultySelector selected="Musculacao" />
                </FormField>
              </div>
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Wizard step 2: Media upload (720-900)
// ---------------------------------------------------------------------------

const SceneWizardStep2: React.FC = () => {
  const frame = useCurrentFrame();

  const gradientProgress = interpolate(frame, [20, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing[8],
              padding: spacing[6],
              height: "100%",
            }}
          >
            <StepIndicator current={2} total={5} delay={5} />

            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius["2xl"],
                padding: spacing[8],
                width: "100%",
                maxWidth: 720,
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                gap: spacing[6],
                ...fadeUpIn(frame, 10),
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  color: colors.gray[900],
                }}
              >
                Capa e Midia
              </div>

              {/* Upload area */}
              <div
                style={{
                  height: 280,
                  borderRadius: borderRadius["2xl"],
                  border: `2px dashed ${colors.primary[300]}`,
                  background: `linear-gradient(135deg,
                    ${colors.primary[50]}${Math.round(gradientProgress * 255).toString(16).padStart(2, "0")},
                    ${colors.teal[500]}${Math.round(gradientProgress * 80).toString(16).padStart(2, "0")}
                  )`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing[4],
                  transition: "all 0.5s",
                }}
              >
                {/* Upload icon */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.primary[100],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${interpolate(frame, [20, 45], [0.5, 1], { extrapolateRight: "clamp" })})`,
                    opacity: interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" }),
                  }}
                >
                  <svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke={colors.primary[500]}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="17 8 12 3 7 8"
                      stroke={colors.primary[500]}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="15"
                      stroke={colors.primary[500]}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div
                  style={{
                    ...fadeUpIn(frame, 40),
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.base,
                      fontWeight: fontWeight.semibold,
                      color: colors.primary[600],
                    }}
                  >
                    Arraste sua imagem aqui
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.sm,
                      color: colors.gray[400],
                      marginTop: 4,
                    }}
                  >
                    ou clique para selecionar — PNG, JPG, MP4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Animated stat pill for Scene 5
// ---------------------------------------------------------------------------

interface StatPillProps {
  value: string;
  label: string;
  delay: number;
  accentColor: string;
}

const StatPill: React.FC<StatPillProps> = ({ value, label, delay, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  const anim = fadeUpIn(frame, delay);

  return (
    <div
      style={{
        ...anim,
        transform: `scale(${scaleSpring})`,
        backgroundColor: colors.white,
        borderRadius: borderRadius["2xl"],
        padding: spacing[6],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing[3],
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        flex: 1,
        borderTop: `4px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: fontSize["4xl"],
          fontWeight: fontWeight.bold,
          color: accentColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.base,
          fontWeight: fontWeight.medium,
          color: colors.gray[500],
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Wizard step 3: Schedule stats (900-1080)
// ---------------------------------------------------------------------------

const SceneWizardStep3: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing[8],
              padding: spacing[6],
              height: "100%",
            }}
          >
            <StepIndicator current={3} total={5} delay={5} />

            <div
              style={{
                width: "100%",
                maxWidth: 720,
                display: "flex",
                flexDirection: "column",
                gap: spacing[6],
                ...fadeUpIn(frame, 10),
              }}
            >
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius["2xl"],
                  padding: spacing[6],
                  boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: fontSize["2xl"],
                    fontWeight: fontWeight.bold,
                    color: colors.gray[900],
                    marginBottom: spacing[6],
                  }}
                >
                  Cronograma
                </div>

                {/* Stat pills with animated numbers */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: spacing[5],
                  }}
                >
                  <StatPill
                    value="8"
                    label="semanas"
                    delay={20}
                    accentColor={colors.primary[500]}
                  />
                  <StatPill
                    value="4x"
                    label="por semana"
                    delay={40}
                    accentColor={colors.teal[500]}
                  />
                  <StatPill
                    value="60"
                    label="min por sessao"
                    delay={60}
                    accentColor={colors.accent[500]}
                  />
                </div>
              </div>
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Wizard step 4: Exercise list (1080-1320)
// ---------------------------------------------------------------------------

const SceneWizardStep4: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing[8],
              padding: spacing[6],
              height: "100%",
            }}
          >
            <StepIndicator current={4} total={5} delay={5} />

            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius["2xl"],
                padding: spacing[8],
                width: "100%",
                maxWidth: 720,
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                gap: spacing[5],
                ...fadeUpIn(frame, 10),
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: fontSize["2xl"],
                    fontWeight: fontWeight.bold,
                    color: colors.gray[900],
                  }}
                >
                  Exercicios
                </div>
                <div
                  style={{
                    backgroundColor: colors.primary[50],
                    borderRadius: borderRadius.full,
                    paddingLeft: spacing[4],
                    paddingRight: spacing[4],
                    paddingTop: spacing[2],
                    paddingBottom: spacing[2],
                    fontFamily: fonts.body,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                    color: colors.primary[600],
                  }}
                >
                  {mockExercises.length} exercicios
                </div>
              </div>

              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px 80px",
                  gap: spacing[4],
                  paddingBottom: spacing[3],
                  borderBottom: `1px solid ${colors.gray[100]}`,
                }}
              >
                {["Exercicio", "Series", "Reps", "Descanso"].map((h) => (
                  <div
                    key={h}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.semibold,
                      color: colors.gray[400],
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Exercise rows sliding in */}
              {mockExercises.map((ex, i) => {
                const delay = stagger(i, 20, 25);
                const slideX = interpolate(
                  Math.max(0, frame - delay),
                  [0, 20],
                  [-50, 0],
                  { extrapolateRight: "clamp" }
                );
                const anim = fadeUpIn(frame, delay);

                return (
                  <div
                    key={ex.name}
                    style={{
                      ...anim,
                      transform: `translateX(${slideX}px)`,
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 80px 80px",
                      gap: spacing[4],
                      alignItems: "center",
                      paddingBottom: spacing[4],
                      borderBottom:
                        i < mockExercises.length - 1
                          ? `1px solid ${colors.gray[50]}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: fontSize.base,
                        fontWeight: fontWeight.semibold,
                        color: colors.gray[800],
                      }}
                    >
                      {ex.name}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: fontSize.base,
                        color: colors.gray[600],
                        textAlign: "center" as const,
                      }}
                    >
                      {ex.sets}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: fontSize.base,
                        color: colors.gray[600],
                        textAlign: "center" as const,
                      }}
                    >
                      {ex.reps}
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.body,
                        fontSize: fontSize.sm,
                        color: colors.gray[500],
                        textAlign: "center" as const,
                        backgroundColor: colors.gray[100],
                        borderRadius: borderRadius.full,
                        paddingTop: 4,
                        paddingBottom: 4,
                      }}
                    >
                      {ex.rest}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Wizard step 5: Pricing (1320-1500)
// ---------------------------------------------------------------------------

const SceneWizardStep5: React.FC = () => {
  const frame = useCurrentFrame();

  const priceScale = spring({
    frame: Math.max(0, frame - 30),
    fps: 30,
    config: { damping: 12, stiffness: 200 },
  });

  const originalOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <TreinosBackground>
      <BrowserMockup>
        <CMSLayout activeItem="treinos">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing[8],
              padding: spacing[6],
              height: "100%",
            }}
          >
            <StepIndicator current={5} total={5} delay={5} />

            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius["2xl"],
                padding: spacing[8],
                width: "100%",
                maxWidth: 560,
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: spacing[6],
                ...fadeUpIn(frame, 10),
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  color: colors.gray[900],
                  textAlign: "center",
                }}
              >
                Defina o Preco
              </div>

              {/* Price display */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing[3],
                }}
              >
                {/* Original price crossed out */}
                <div
                  style={{
                    opacity: originalOpacity,
                    fontFamily: fonts.body,
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.medium,
                    color: colors.gray[400],
                    textDecoration: "line-through",
                    textDecorationColor: colors.error,
                    textDecorationThickness: 2,
                  }}
                >
                  R$ 199,90
                </div>

                {/* Current price */}
                <div
                  style={{
                    transform: `scale(${priceScale})`,
                    fontFamily: fonts.display,
                    fontSize: fontSize["6xl"],
                    fontWeight: fontWeight.bold,
                    color: colors.primary[600],
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  R$ 149,90
                </div>

                {/* Per month label */}
                <div
                  style={{
                    ...fadeUpIn(frame, 50),
                    fontFamily: fonts.body,
                    fontSize: fontSize.base,
                    color: colors.gray[500],
                  }}
                >
                  por mes — acesso completo
                </div>
              </div>

              {/* Savings badge */}
              <div
                style={{
                  ...fadeUpIn(frame, 70),
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  borderRadius: borderRadius.full,
                  paddingLeft: spacing[5],
                  paddingRight: spacing[5],
                  paddingTop: spacing[2],
                  paddingBottom: spacing[2],
                  fontFamily: fonts.body,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  color: colors.success,
                }}
              >
                Economia de R$ 50,00 por aluno
              </div>
            </div>
          </div>
        </CMSLayout>
      </BrowserMockup>
    </TreinosBackground>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — Success animation (1500-1800)
// ---------------------------------------------------------------------------

const SceneSuccess: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  const ringScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const textAnim = fadeUpIn(frame, 50);
  const subTextAnim = fadeUpIn(frame, 70);

  const confettiItems = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 6,
    x: 50 + (i / 7) * 900 + 512,
    color: [
      colors.primary[400],
      colors.teal[500],
      colors.accent[400],
      colors.warning,
      colors.primary[300],
      colors.success,
      colors.accent[500],
      colors.teal[600],
    ][i],
  }));

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
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 50% 45% at 50% 50%, ${colors.primary[900]}55, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Confetti particles */}
      {confettiItems.map((item, i) => {
        const particleFrame = Math.max(0, frame - item.delay);
        const yPos = interpolate(particleFrame, [0, 120], [0, 400], {
          extrapolateRight: "clamp",
        });
        const particleOpacity = interpolate(
          particleFrame,
          [0, 10, 90, 120],
          [0, 1, 1, 0],
          { extrapolateRight: "clamp" }
        );
        const rotation = particleFrame * (i % 2 === 0 ? 4 : -3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: item.x,
              top: 300 - yPos,
              width: 10,
              height: 10,
              borderRadius: i % 3 === 0 ? 9999 : 2,
              backgroundColor: item.color,
              opacity: particleOpacity,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}

      {/* Checkmark circle */}
      <div
        style={{
          position: "relative",
          width: 160,
          height: 160,
          transform: `scale(${checkScale})`,
          zIndex: 1,
        }}
      >
        {/* Outer ring pulse */}
        <div
          style={{
            position: "absolute",
            inset: -16,
            borderRadius: borderRadius.full,
            border: `3px solid ${colors.primary[400]}`,
            opacity: interpolate(frame, [20, 60], [0, 0.4], { extrapolateRight: "clamp" }),
            transform: `scale(${ringScale})`,
          }}
        />

        {/* Circle */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: borderRadius.full,
            background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.teal[500]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 16px 64px ${colors.primary[500]}55`,
          }}
        >
          {/* Checkmark SVG */}
          <svg width={72} height={72} viewBox="0 0 72 72" fill="none">
            <path
              d="M14 36L30 52L58 24"
              stroke={colors.white}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={80}
              strokeDashoffset={interpolate(
                Math.max(0, frame - 15),
                [0, 30],
                [80, 0],
                { extrapolateRight: "clamp" }
              )}
            />
          </svg>
        </div>
      </div>

      {/* Success text */}
      <div
        style={{
          ...textAnim,
          fontFamily: fonts.display,
          fontSize: fontSize["4xl"],
          fontWeight: fontWeight.bold,
          color: colors.white,
          letterSpacing: "-0.02em",
          textAlign: "center",
          zIndex: 1,
        }}
      >
        Programa publicado com sucesso!
      </div>

      {/* Sub text */}
      <div
        style={{
          ...subTextAnim,
          fontFamily: fonts.body,
          fontSize: fontSize.xl,
          fontWeight: fontWeight.medium,
          color: colors.gray[400],
          textAlign: "center",
          zIndex: 1,
        }}
      >
        Seu programa ja esta disponivel para os alunos
      </div>

      {/* Callout */}
      <CalloutBubble
        text="Pronto para seus alunos!"
        x={960}
        y={730}
        delay={80}
        direction="top"
        holdFrames={180}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const TreinosVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Program grid (0-300) */}
      <Sequence from={0} durationInFrames={300}>
        <SceneProgramGrid />
      </Sequence>

      {/* Scene 2: Highlight button (300-450) */}
      <Sequence from={300} durationInFrames={150}>
        <SceneHighlightButton />
      </Sequence>

      {/* Scene 3: Wizard step 1 — Info (450-720) */}
      <Sequence from={450} durationInFrames={270}>
        <SceneWizardStep1 />
      </Sequence>

      {/* Scene 4: Wizard step 2 — Media (720-900) */}
      <Sequence from={720} durationInFrames={180}>
        <SceneWizardStep2 />
      </Sequence>

      {/* Scene 5: Wizard step 3 — Schedule (900-1080) */}
      <Sequence from={900} durationInFrames={180}>
        <SceneWizardStep3 />
      </Sequence>

      {/* Scene 6: Wizard step 4 — Exercises (1080-1320) */}
      <Sequence from={1080} durationInFrames={240}>
        <SceneWizardStep4 />
      </Sequence>

      {/* Scene 7: Wizard step 5 — Pricing (1320-1500) */}
      <Sequence from={1320} durationInFrames={180}>
        <SceneWizardStep5 />
      </Sequence>

      {/* Scene 8: Success (1500-1800) */}
      <Sequence from={1500} durationInFrames={300}>
        <SceneSuccess />
      </Sequence>
    </AbsoluteFill>
  );
};
