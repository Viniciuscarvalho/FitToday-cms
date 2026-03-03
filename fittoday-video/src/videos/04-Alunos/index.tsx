import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { BrowserMockup, CMSLayout } from "../../components/layout";
import {
  StudentRow,
  Badge,
  ProgressBar,
  AnimatedText,
  AnimatedNumber,
} from "../../components/ui";
import { AnimatedLineChart } from "../../components/charts/AnimatedLineChart";
import { CalloutBubble } from "../../components/annotations/CalloutBubble";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import {
  mockStudents,
  formatBRL,
} from "../../utils/mockData";
import { fadeUpIn, fadeIn, fadeOut, stagger, SPRING_SNAPPY, SPRING_BOUNCY } from "../../utils/animations";

// ---------------------------------------------------------------------------
// Scene 1 — Student list with stats row
// ---------------------------------------------------------------------------

const SmallMetricCard: React.FC<{
  label: string;
  value: string;
  color: string;
  delay: number;
}> = ({ label, value, color, delay }) => {
  const frame = useCurrentFrame();
  const entrance = fadeUpIn(frame, delay);

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: `${spacing[4]}px ${spacing[5]}px`,
        flex: 1,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        borderTop: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        gap: spacing[1],
        ...entrance,
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          color: colors.gray[500],
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: fontSize["2xl"],
          fontWeight: fontWeight.bold,
          color: colors.gray[900],
        }}
      >
        {value}
      </span>
    </div>
  );
};

const Scene1: React.FC = () => {
  const frame = useCurrentFrame();

  const tableEntrance = fadeUpIn(frame, 30);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing[5], height: "100%" }}>
      {/* Stats row */}
      <div style={{ display: "flex", flexDirection: "row", gap: spacing[4] }}>
        <SmallMetricCard label="Alunos Ativos" value="24" color={colors.statGradients.students[0]} delay={10} />
        <SmallMetricCard label="Media de Conclusao" value="73%" color={colors.primary[500]} delay={20} />
        <SmallMetricCard label="Novos esta Semana" value="3" color={colors.teal[500]} delay={30} />
        <SmallMetricCard label="Cancelamentos" value="1" color={colors.error} delay={40} />
      </div>

      {/* Students table */}
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          flex: 1,
          ...tableEntrance,
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: spacing[5],
            paddingRight: spacing[5],
            paddingTop: spacing[4],
            paddingBottom: spacing[4],
            borderBottom: `1px solid ${colors.gray[100]}`,
            backgroundColor: colors.gray[50],
          }}
        >
          {["Aluno", "Programa", "Status", "Progresso"].map((h, i) => (
            <span
              key={h}
              style={{
                fontFamily: fonts.body,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                color: colors.gray[500],
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                flex: i === 0 ? 1 : i === 3 ? 0 : "none",
                width: i === 1 ? 160 : i === 2 ? 100 : undefined,
                flexShrink: 0,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Student rows staggered */}
        {mockStudents.map((student, i) => (
          <StudentRow
            key={student.name}
            name={student.name}
            program={student.program}
            status={student.status}
            progress={student.progress}
            delay={stagger(i, 40, 10)}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Search bar animation + filtered results
// ---------------------------------------------------------------------------

const SEARCH_TEXT = "Maria";

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typewriter for search input
  const charsToShow = Math.min(
    Math.floor(Math.max(0, frame - 15) * 1.2),
    SEARCH_TEXT.length
  );
  const typedText = SEARCH_TEXT.slice(0, charsToShow);

  const filteredStudents = mockStudents.filter((s) =>
    s.name.toLowerCase().includes("maria")
  );

  const tableEntrance = fadeUpIn(frame, 10);
  const searchEntrance = fadeUpIn(frame, 0);

  // Rows fade in after text is typed
  const rowsVisible = charsToShow >= SEARCH_TEXT.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing[5], height: "100%" }}>
      {/* Search bar */}
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: `${spacing[3]}px ${spacing[5]}px`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[3],
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          border: `2px solid ${colors.primary[500]}`,
          ...searchEntrance,
        }}
      >
        {/* Search icon */}
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke={colors.gray[400]} strokeWidth={2} />
          <path d="M21 21l-4.35-4.35" stroke={colors.gray[400]} strokeWidth={2} strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.base,
            color: colors.gray[900],
            flex: 1,
          }}
        >
          {typedText}
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "1.1em",
              backgroundColor: colors.primary[500],
              marginLeft: 2,
              verticalAlign: "text-bottom",
              opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
            }}
          />
        </span>
      </div>

      {/* Filtered table */}
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          flex: 1,
          opacity: rowsVisible ? 1 : 0.3,
          transition: "opacity 0.3s",
          ...tableEntrance,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: spacing[5],
            paddingRight: spacing[5],
            paddingTop: spacing[4],
            paddingBottom: spacing[4],
            borderBottom: `1px solid ${colors.gray[100]}`,
            backgroundColor: colors.gray[50],
          }}
        >
          <span style={{ fontFamily: fonts.body, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray[500] }}>
            {rowsVisible ? `${filteredStudents.length} resultado(s) para "${SEARCH_TEXT}"` : "Buscando..."}
          </span>
        </div>

        {filteredStudents.map((student, i) => (
          <StudentRow
            key={student.name}
            name={student.name}
            program={student.program}
            status={student.status}
            progress={student.progress}
            delay={rowsVisible ? i * 8 : 9999}
          />
        ))}
      </div>

      {/* Callout */}
      <CalloutBubble
        text="Busca e filtros avancados"
        x={400}
        y={80}
        delay={120}
        direction="bottom"
        holdFrames={180}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Student detail panel
// ---------------------------------------------------------------------------

const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const student = mockStudents[0]; // Maria Silva

  // Panel slides in from right
  const panelSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: SPRING_SNAPPY,
  });
  const panelX = interpolate(panelSpring, [0, 1], [80, 0]);
  const panelOpacity = interpolate(panelSpring, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  const tableEntrance = fadeUpIn(frame, 0);

  const tabs = ["Visao Geral", "Progresso", "Treinos", "Financeiro"];

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: spacing[5], height: "100%" }}>
      {/* Table (dimmed) */}
      <div
        style={{
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          opacity: 0.35,
          ...tableEntrance,
        }}
      >
        {mockStudents.map((s, i) => (
          <StudentRow
            key={s.name}
            name={s.name}
            program={s.program}
            status={s.status}
            progress={s.progress}
            delay={i * 5}
          />
        ))}
      </div>

      {/* Detail panel */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          overflow: "hidden",
          transform: `translateX(${panelX}px)`,
          opacity: panelOpacity,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.teal[600]})`,
            padding: `${spacing[6]}px ${spacing[5]}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: spacing[3],
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: borderRadius.full,
              background: `linear-gradient(135deg, ${colors.primary[300]}, ${colors.primary[500]})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.display,
              fontSize: fontSize["3xl"],
              fontWeight: fontWeight.bold,
              color: colors.white,
              border: `3px solid rgba(255,255,255,0.3)`,
            }}
          >
            M
          </div>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontFamily: fonts.display, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.white }}>
              {student.name}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
              {student.email}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {student.phone}
            </div>
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: "rgba(255,255,255,0.6)" }}>
            Desde {student.joinDate}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            borderBottom: `1px solid ${colors.gray[100]}`,
            backgroundColor: colors.gray[50],
          }}
        >
          {tabs.map((tab, i) => (
            <div
              key={tab}
              style={{
                flex: 1,
                padding: `${spacing[3]}px ${spacing[1]}px`,
                textAlign: "center" as const,
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: i === 0 ? fontWeight.semibold : fontWeight.normal,
                color: i === 0 ? colors.primary[600] : colors.gray[400],
                borderBottom: i === 0 ? `2px solid ${colors.primary[500]}` : "2px solid transparent",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Overview content */}
        <div style={{ padding: spacing[5], display: "flex", flexDirection: "column", gap: spacing[4] }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
            <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.gray[400], textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Programa
            </span>
            <span style={{ fontFamily: fonts.body, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.gray[900] }}>
              {student.program}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.gray[400], textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Assinatura
            </span>
            <Badge label="Ativo" variant="success" />
          </div>

          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.gray[400], textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Dias Ativos
            </span>
            <span style={{ fontFamily: fonts.display, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.gray[900] }}>
              <AnimatedNumber value={47} delay={40} duration={40} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Progress tab: ring + attendance bars + weight line chart
// ---------------------------------------------------------------------------

const weightData = [
  { label: "Jan", value: 78 },
  { label: "Fev", value: 76.5 },
  { label: "Mar", value: 75.2 },
  { label: "Abr", value: 74.8 },
  { label: "Mai", value: 73.5 },
  { label: "Jun", value: 72.1 },
];

const attendanceData = [
  { label: "Seg", value: 4 },
  { label: "Ter", value: 3 },
  { label: "Qua", value: 4 },
  { label: "Qui", value: 2 },
  { label: "Sex", value: 4 },
  { label: "Sab", value: 3 },
];

const ProgressRing: React.FC<{ progress: number; delay: number }> = ({ progress, delay }) => {
  const frame = useCurrentFrame();

  const r = 70;
  const circumference = 2 * Math.PI * r;
  const animatedProgress = interpolate(
    Math.max(0, frame - delay),
    [0, 60],
    [0, progress],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const dashOffset = circumference - (animatedProgress / 100) * circumference;
  const opacity = interpolate(Math.max(0, frame - delay), [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing[3], opacity }}>
      <div style={{ position: "relative", width: 160, height: 160 }}>
        <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={80} cy={80} r={r} fill="none" stroke={colors.gray[100]} strokeWidth={12} />
          {/* Progress */}
          <circle
            cx={80}
            cy={80}
            r={r}
            fill="none"
            stroke={colors.primary[500]}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ filter: `drop-shadow(0 0 6px ${colors.primary[400]}80)` }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: fonts.display, fontSize: fontSize["3xl"], fontWeight: fontWeight.bold, color: colors.gray[900] }}>
            {Math.round(animatedProgress)}%
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.gray[400] }}>conclusao</span>
        </div>
      </div>
      <span style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.gray[600] }}>Maria Silva — Forca Total</span>
    </div>
  );
};

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const tabs = ["Visao Geral", "Progresso", "Treinos", "Financeiro"];
  const titleEntrance = fadeUpIn(frame, 10);

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: spacing[5], height: "100%" }}>
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Tabs row */}
        <div style={{ display: "flex", flexDirection: "row", borderBottom: `1px solid ${colors.gray[100]}`, backgroundColor: colors.gray[50] }}>
          {tabs.map((tab, i) => (
            <div
              key={tab}
              style={{
                padding: `${spacing[4]}px ${spacing[5]}px`,
                fontFamily: fonts.body,
                fontSize: fontSize.sm,
                fontWeight: i === 1 ? fontWeight.semibold : fontWeight.normal,
                color: i === 1 ? colors.primary[600] : colors.gray[400],
                borderBottom: i === 1 ? `2px solid ${colors.primary[500]}` : "2px solid transparent",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Charts area */}
        <div style={{ padding: spacing[6], display: "flex", flexDirection: "row", gap: spacing[8], alignItems: "flex-start", flex: 1 }}>
          {/* Progress ring */}
          <ProgressRing progress={73} delay={10} />

          {/* Right column: attendance + weight chart */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: spacing[6] }}>
            {/* Attendance label */}
            <div style={titleEntrance}>
              <span style={{ fontFamily: fonts.body, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray[700] }}>
                Frequencia Semanal
              </span>
              <div style={{ marginTop: spacing[3] }}>
                {attendanceData.map((d, i) => {
                  const barW = interpolate(
                    Math.max(0, frame - (20 + i * 8)),
                    [0, 20],
                    [0, (d.value / 4) * 100],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  );
                  return (
                    <div key={d.label} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: spacing[3], marginBottom: spacing[2] }}>
                      <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.gray[400], width: 30, textAlign: "right" as const }}>{d.label}</span>
                      <div style={{ flex: 1, height: 10, backgroundColor: colors.gray[100], borderRadius: borderRadius.full, overflow: "hidden" }}>
                        <div style={{ width: `${barW}%`, height: "100%", backgroundColor: colors.primary[500], borderRadius: borderRadius.full }} />
                      </div>
                      <span style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.gray[500], width: 20 }}>{d.value}/4</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weight evolution */}
            <div>
              <span style={{ fontFamily: fonts.body, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray[700] }}>
                Evolucao de Peso (kg)
              </span>
              <div style={{ marginTop: spacing[3] }}>
                <AnimatedLineChart
                  data={weightData}
                  width={340}
                  height={120}
                  lineColor={colors.teal[600]}
                  delay={60}
                  showArea
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Star rating + review + fade out
// ---------------------------------------------------------------------------

const StarRating: React.FC<{ rating: number; delay: number }> = ({ rating, delay }) => {
  const frame = useCurrentFrame();
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: spacing[1] }}>
      {stars.map((star) => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star === Math.ceil(rating);
        const starOpacity = interpolate(
          Math.max(0, frame - (delay + star * 6)),
          [0, 10],
          [0, 1],
          { extrapolateRight: "clamp" }
        );
        return (
          <svg key={star} width={32} height={32} viewBox="0 0 24 24" style={{ opacity: starOpacity }}>
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              fill={filled || half ? colors.warning : "none"}
              stroke={colors.warning}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
};

const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardEntrance = fadeUpIn(frame, 0);
  const reviewEntrance = fadeIn(frame, 40);
  const fadeOutStyle = fadeOut(frame, 110, 30);

  const finalOpacity = Math.min(
    interpolate(Math.max(0, frame), [0, 15], [0, 1], { extrapolateRight: "clamp" }),
    fadeOutStyle.opacity !== undefined ? fadeOutStyle.opacity : 1
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: spacing[6],
        opacity: finalOpacity,
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius["2xl"],
          padding: `${spacing[8]}px ${spacing[10]}px`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: spacing[5],
          maxWidth: 560,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: borderRadius.full,
            background: `linear-gradient(135deg, ${colors.primary[400]}, ${colors.primary[600]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.display,
            fontSize: fontSize["3xl"],
            fontWeight: fontWeight.bold,
            color: colors.white,
          }}
        >
          M
        </div>

        {/* Name */}
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: fonts.display, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.gray[900] }}>
            Maria Silva
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.gray[500], marginTop: 4 }}>
            Aluna desde Janeiro 2026
          </div>
        </div>

        {/* Stars */}
        <StarRating rating={4.5} delay={10} />

        {/* Rating label */}
        <div style={{ fontFamily: fonts.display, fontSize: fontSize["2xl"], fontWeight: fontWeight.bold, color: colors.warning }}>
          4.5 / 5
        </div>

        {/* Review text */}
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.base,
            color: colors.gray[600],
            textAlign: "center" as const,
            lineHeight: 1.7,
            margin: 0,
            maxWidth: 440,
            ...reviewEntrance,
          }}
        >
          "O programa de Forca Total mudou minha vida! Em 6 meses perdi 6kg e ganhei muito mais disposicao. O acompanhamento do professor Carlos e incrivel."
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Background wrapper (gradient bg)
// ---------------------------------------------------------------------------

const VideoBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(135deg, ${colors.gray[900]} 0%, ${colors.gray[950]} 100%)`,
      padding: 40,
    }}
  >
    {children}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const AlunosVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Student list (0-450) */}
      <Sequence from={0} durationInFrames={450}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="alunos">
              <Scene1 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 2: Search animation (450-750) */}
      <Sequence from={450} durationInFrames={300}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="alunos">
              <Scene2 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 3: Student detail panel (750-1050) */}
      <Sequence from={750} durationInFrames={300}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="alunos">
              <Scene3 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 4: Progress tab (1050-1350) */}
      <Sequence from={1050} durationInFrames={300}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="alunos">
              <Scene4 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>

      {/* Scene 5: Star rating + fade out (1350-1500) */}
      <Sequence from={1350} durationInFrames={150}>
        <VideoBackground>
          <BrowserMockup>
            <CMSLayout activeItem="alunos">
              <Scene5 />
            </CMSLayout>
          </BrowserMockup>
        </VideoBackground>
      </Sequence>
    </AbsoluteFill>
  );
};
