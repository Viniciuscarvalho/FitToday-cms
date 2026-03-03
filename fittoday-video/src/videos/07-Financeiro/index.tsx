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
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { Badge } from "../../components/ui/Badge";
import { CalloutBubble } from "../../components/annotations/CalloutBubble";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { mockTransactions } from "../../utils/mockData";
import {
  fadeUpIn,
  springScale,
  stagger,
  fadeIn,
  fadeOut,
  SPRING_BOUNCY,
  SPRING_SNAPPY,
  pulse,
} from "../../utils/animations";

// ---------------------------------------------------------------------------
// Scene 1: Stripe Connect Onboarding (0-450)
// ---------------------------------------------------------------------------

const StepItem: React.FC<{
  label: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ label, delay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay);
  const scaleS = spring({ frame: localFrame, fps, config: SPRING_BOUNCY });
  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[3],
        opacity,
        transform: `scale(${scaleS})`,
        transformOrigin: "left center",
      }}
    >
      {/* Green checkmark circle */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primary[500],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px ${colors.primary[500]}60`,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7L5.5 10L11.5 4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.base,
          fontWeight: fontWeight.medium,
          color: colors.gray[700],
        }}
      >
        {label}
      </span>
    </div>
  );
};

const StripeOnboardingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Button click effect: scale down at frame 90, then back
  const clickProgress = interpolate(frame, [80, 95, 110], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonScale = 1 - clickProgress * 0.06;

  // Button glow pulse
  const glowIntensity = pulse(frame, 0.08);

  // Steps appear after button click
  const step1Delay = 120;
  const step2Delay = 180;
  const step3Delay = 240;

  return (
    <BrowserMockup>
      <CMSLayout activeItem="financeiro">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: spacing[8],
          }}
        >
          {/* Stripe Connect Card */}
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius["2xl"],
              padding: spacing[12],
              boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: spacing[8],
              width: 480,
              border: `1px solid ${colors.gray[200]}`,
            }}
          >
            {/* Stripe logo */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: spacing[3],
              }}
            >
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["4xl"],
                  fontWeight: fontWeight.bold,
                  color: "#6366f1",
                  letterSpacing: "-0.02em",
                }}
              >
                stripe
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.gray[800],
                  textAlign: "center",
                }}
              >
                Conecte sua conta para receber pagamentos
              </span>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: fontSize.sm,
                  color: colors.gray[500],
                  textAlign: "center",
                }}
              >
                Receba diretamente na sua conta bancaria com seguranca
              </span>
            </div>

            {/* Connect button with pulse glow */}
            <div
              style={{
                transform: `scale(${buttonScale})`,
                transition: "transform 0.1s",
              }}
            >
              <div
                style={{
                  backgroundColor: "#6366f1",
                  borderRadius: borderRadius.xl,
                  paddingTop: spacing[4],
                  paddingBottom: spacing[4],
                  paddingLeft: spacing[8],
                  paddingRight: spacing[8],
                  boxShadow: `0 0 ${24 * glowIntensity}px rgba(99, 102, 241, 0.6), 0 4px 14px rgba(99, 102, 241, 0.4)`,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    color: colors.white,
                    letterSpacing: "0.01em",
                  }}
                >
                  Conectar conta Stripe
                </span>
              </div>
            </div>

            {/* Onboarding steps */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
                width: "100%",
              }}
            >
              <StepItem
                label="Verificar email"
                delay={step1Delay}
                frame={frame}
                fps={fps}
              />
              <StepItem
                label="Informacoes bancarias confirmadas"
                delay={step2Delay}
                frame={frame}
                fps={fps}
              />
              <StepItem
                label="Identidade verificada"
                delay={step3Delay}
                frame={frame}
                fps={fps}
              />
            </div>
          </div>
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 2: Balance Cards (450-900)
// ---------------------------------------------------------------------------

const BalanceCard: React.FC<{
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  accentColor: string;
  change?: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({
  label,
  value,
  prefix = "R$ ",
  suffix = "",
  accentColor,
  change,
  delay,
  frame,
  fps,
}) => {
  const localFrame = Math.max(0, frame - delay);
  const scaleS = spring({ frame: localFrame, fps, config: SPRING_BOUNCY });
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scaleS})`,
        transformOrigin: "top center",
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        border: `2px solid ${accentColor}40`,
        borderLeft: `4px solid ${accentColor}`,
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: spacing[3],
      }}
    >
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          color: colors.gray[500],
          letterSpacing: "0.03em",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
      <AnimatedNumber
        value={value}
        delay={delay + 10}
        prefix={prefix}
        suffix={suffix}
        decimals={2}
        duration={45}
        style={{
          fontSize: fontSize["2xl"],
          color: colors.gray[900],
          fontFamily: fonts.display,
        }}
      />
      {change && (
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: colors.primary[600],
          }}
        >
          {change}
        </span>
      )}
    </div>
  );
};

const BalanceCardsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <BrowserMockup>
      <CMSLayout activeItem="financeiro">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing[6],
            height: "100%",
            position: "relative",
          }}
        >
          {/* Section title */}
          <div style={fadeUpIn(frame, 0)}>
            <span
              style={{
                fontFamily: fonts.display,
                fontSize: fontSize["2xl"],
                fontWeight: fontWeight.bold,
                color: colors.gray[900],
              }}
            >
              Resumo Financeiro
            </span>
          </div>

          {/* Balance cards grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: spacing[4],
            }}
          >
            <BalanceCard
              label="Saldo Disponivel"
              value={4365}
              accentColor={colors.primary[500]}
              delay={20}
              frame={frame}
              fps={fps}
            />
            <BalanceCard
              label="Saldo Pendente"
              value={1230}
              accentColor={colors.warning}
              delay={40}
              frame={frame}
              fps={fps}
            />
            <BalanceCard
              label="Receita do Mes"
              value={5595}
              accentColor={colors.info}
              change="+18.3% vs mes anterior"
              delay={60}
              frame={frame}
              fps={fps}
            />
            <BalanceCard
              label="Total Acumulado"
              value={28450}
              accentColor="#a855f7"
              delay={80}
              frame={frame}
              fps={fps}
            />
          </div>

          {/* Callout bubble */}
          <CalloutBubble
            text="Gerencie suas financas em um so lugar"
            x={960}
            y={200}
            delay={120}
            direction="bottom"
            holdFrames={200}
          />
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: Recent Transactions Table (900-1200)
// ---------------------------------------------------------------------------

type TransactionType = "sale" | "payout" | "refund";
type TransactionStatus = "completed" | "pending";

const TransactionRow: React.FC<{
  tx: {
    type: TransactionType;
    description: string;
    student: string;
    amount: number;
    status: TransactionStatus;
    date: string;
  };
  delay: number;
  frame: number;
}> = ({ tx, delay, frame }) => {
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(localFrame, [0, 15], [-20, 0], {
    extrapolateRight: "clamp",
  });

  const typeColors: Record<TransactionType, string> = {
    sale: colors.primary[500],
    payout: colors.info,
    refund: colors.error,
  };

  const typeArrows: Record<TransactionType, string> = {
    sale: "M12 19V5M5 12l7-7 7 7",
    payout: "M12 5v14M5 12l7 7 7-7",
    refund: "M12 19V5M5 12l7-7 7 7",
  };

  const isPositive = tx.type === "sale" || tx.type === "payout";
  const amountStr = tx.amount >= 0 ? `+R$ ${tx.amount.toFixed(2).replace(".", ",")}` : `-R$ ${Math.abs(tx.amount).toFixed(2).replace(".", ",")}`;
  const amountColor =
    tx.type === "sale"
      ? colors.primary[600]
      : tx.type === "payout"
      ? colors.info
      : colors.error;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[4],
        padding: `${spacing[4]}px ${spacing[6]}px`,
        borderBottom: `1px solid ${colors.gray[100]}`,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Type icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: borderRadius.lg,
          backgroundColor: `${typeColors[tx.type]}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={typeColors[tx.type]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={typeArrows[tx.type]} />
        </svg>
      </div>

      {/* Description + student */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: colors.gray[900],
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tx.description}
        </div>
        {tx.student && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: fontSize.xs,
              color: colors.gray[500],
            }}
          >
            {tx.student}
          </div>
        )}
      </div>

      {/* Amount */}
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: fontSize.base,
          fontWeight: fontWeight.bold,
          color: amountColor,
          flexShrink: 0,
          minWidth: 120,
          textAlign: "right" as const,
        }}
      >
        {amountStr}
      </div>

      {/* Status badge */}
      <div style={{ flexShrink: 0, minWidth: 90, textAlign: "center" as const }}>
        <Badge
          label={tx.status === "completed" ? "Concluido" : "Pendente"}
          variant={tx.status === "completed" ? "success" : "warning"}
        />
      </div>

      {/* Date */}
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: fontSize.xs,
          color: colors.gray[400],
          flexShrink: 0,
          minWidth: 50,
          textAlign: "right" as const,
        }}
      >
        {tx.date}
      </div>
    </div>
  );
};

const TransactionsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <BrowserMockup>
      <CMSLayout activeItem="financeiro">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing[5],
            height: "100%",
          }}
        >
          {/* Section header */}
          <div style={{ ...fadeUpIn(frame, 0) }}>
            <span
              style={{
                fontFamily: fonts.display,
                fontSize: fontSize["2xl"],
                fontWeight: fontWeight.bold,
                color: colors.gray[900],
              }}
            >
              Transacoes Recentes
            </span>
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: `1px solid ${colors.gray[200]}`,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing[4],
                padding: `${spacing[4]}px ${spacing[6]}px`,
                borderBottom: `2px solid ${colors.gray[100]}`,
                backgroundColor: colors.gray[50],
              }}
            >
              {["Tipo", "Descricao / Aluno", "Valor", "Status", "Data"].map(
                (h) => (
                  <div
                    key={h}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.semibold,
                      color: colors.gray[500],
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.05em",
                      flex: h === "Descricao / Aluno" ? 1 : "none",
                      minWidth:
                        h === "Tipo"
                          ? 36
                          : h === "Valor"
                          ? 120
                          : h === "Status"
                          ? 90
                          : h === "Data"
                          ? 50
                          : undefined,
                    }}
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {/* Rows */}
            {mockTransactions.slice(0, 5).map((tx, i) => (
              <TransactionRow
                key={i}
                tx={tx as any}
                delay={stagger(i, 20, 15)}
                frame={frame}
              />
            ))}
          </div>
        </div>
      </CMSLayout>
    </BrowserMockup>
  );
};

// ---------------------------------------------------------------------------
// Scene 4: Payout Timeline (1200-1500)
// ---------------------------------------------------------------------------

const PayoutItem: React.FC<{
  date: string;
  amount: string;
  label: string;
  status: "completed";
  delay: number;
  frame: number;
  fps: number;
  isLast?: boolean;
}> = ({ date, amount, label, status, delay, frame, fps, isLast }) => {
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(localFrame, [0, 15], [30, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: spacing[4],
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Timeline column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: 32,
        }}
      >
        {/* Checkmark circle */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: borderRadius.full,
            backgroundColor: colors.primary[500],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 12px ${colors.primary[500]}50`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7L5.5 10L11.5 4"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* Vertical line connecting to next */}
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 48,
              backgroundColor: colors.primary[200],
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          paddingBottom: isLast ? 0 : spacing[8],
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.xs,
            color: colors.gray[400],
            marginBottom: spacing[1],
          }}
        >
          {date}
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: fontSize.base,
            fontWeight: fontWeight.semibold,
            color: colors.gray[800],
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: fontSize.xl,
            fontWeight: fontWeight.bold,
            color: colors.primary[600],
            marginTop: spacing[1],
          }}
        >
          {amount}
        </div>
      </div>
    </div>
  );
};

const PayoutTimelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade to black at end
  const fadeOutOpacity = interpolate(
    frame,
    [260, 300],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOutOpacity }}>
      <BrowserMockup>
        <CMSLayout activeItem="financeiro">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[6],
              height: "100%",
              position: "relative",
            }}
          >
            {/* Title */}
            <div style={fadeUpIn(frame, 0)}>
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: fontSize["2xl"],
                  fontWeight: fontWeight.bold,
                  color: colors.gray[900],
                }}
              >
                Historico de Saques
              </span>
            </div>

            {/* Timeline card */}
            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.xl,
                padding: spacing[8],
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                border: `1px solid ${colors.gray[200]}`,
                maxWidth: 520,
              }}
            >
              <PayoutItem
                date="25 Fev 2026"
                amount="R$ 2.850,00"
                label="Saque automatico"
                status="completed"
                delay={20}
                frame={frame}
                fps={fps}
              />
              <PayoutItem
                date="25 Jan 2026"
                amount="R$ 2.340,00"
                label="Saque automatico"
                status="completed"
                delay={80}
                frame={frame}
                fps={fps}
              />
              <PayoutItem
                date="25 Dez 2025"
                amount="R$ 1.920,00"
                label="Saque automatico"
                status="completed"
                delay={140}
                frame={frame}
                fps={fps}
                isLast
              />
            </div>

            {/* Callout */}
            <CalloutBubble
              text="Receba automaticamente na sua conta"
              x={700}
              y={160}
              delay={200}
              direction="right"
              holdFrames={90}
            />
          </div>
        </CMSLayout>
      </BrowserMockup>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main video composition
// ---------------------------------------------------------------------------

export const FinanceiroVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.gray[950] }}>
      {/* Scene 1: Stripe Onboarding (0-450) */}
      <Sequence from={0} durationInFrames={450}>
        <AbsoluteFill>
          <StripeOnboardingScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Balance Cards (450-900) */}
      <Sequence from={450} durationInFrames={450}>
        <AbsoluteFill>
          <BalanceCardsScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Transactions Table (900-1200) */}
      <Sequence from={900} durationInFrames={300}>
        <AbsoluteFill>
          <TransactionsScene />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: Payout Timeline (1200-1500) */}
      <Sequence from={1200} durationInFrames={300}>
        <AbsoluteFill>
          <PayoutTimelineScene />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
