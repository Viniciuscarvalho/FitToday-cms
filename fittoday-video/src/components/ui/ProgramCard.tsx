import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { fadeUpIn, SPRING_BOUNCY } from "../../utils/animations";
import { Badge } from "./Badge";

type ProgramStatus = "published" | "draft" | "archived";

interface ProgramCardProps {
  title: string;
  status: ProgramStatus;
  weeks: number;
  daysPerWeek: number;
  students: number;
  price: number;
  rating: number;
  delay?: number;
}

const statusGradients: Record<ProgramStatus, [string, string]> = {
  published: [colors.primary[400], colors.primary[600]],
  draft: [colors.gray[300], colors.gray[500]],
  archived: [colors.accent[300], colors.accent[500]],
};

const statusBadgeVariant: Record<ProgramStatus, "success" | "neutral" | "warning"> = {
  published: "success",
  draft: "neutral",
  archived: "warning",
};

const statusLabels: Record<ProgramStatus, string> = {
  published: "Publicado",
  draft: "Rascunho",
  archived: "Arquivado",
};

export const ProgramCard: React.FC<ProgramCardProps> = ({
  title,
  status,
  weeks,
  daysPerWeek,
  students,
  price,
  rating,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRING_BOUNCY,
  });

  const entrance = fadeUpIn(frame, delay);

  const gradient = statusGradients[status];

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.09)",
    transform: `scale(${scaleSpring})`,
    opacity: entrance.opacity,
    display: "flex",
    flexDirection: "column",
    width: "100%",
  };

  const coverStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    height: 120,
    display: "flex",
    alignItems: "flex-end",
    padding: spacing[4],
    position: "relative",
  };

  const coverPatternStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundImage:
      "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 12px)",
  };

  const bodyStyle: React.CSSProperties = {
    padding: spacing[5],
    display: "flex",
    flexDirection: "column",
    gap: spacing[4],
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    margin: 0,
    lineHeight: 1.3,
  };

  const metaRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: spacing[4],
    flexWrap: "wrap" as const,
  };

  const metaItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  };

  const metaLabelStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  };

  const metaValueStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
  };

  const footerRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing[3],
    borderTop: `1px solid ${colors.gray[100]}`,
    marginTop: "auto",
  };

  const priceStyle: React.CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  };

  const ratingStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
  };

  return (
    <div style={cardStyle}>
      <div style={coverStyle}>
        <div style={coverPatternStyle} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Badge label={statusLabels[status]} variant={statusBadgeVariant[status]} />
        </div>
      </div>

      <div style={bodyStyle}>
        <p style={titleStyle}>{title}</p>

        <div style={metaRowStyle}>
          <div style={metaItemStyle}>
            <span style={metaLabelStyle}>Semanas</span>
            <span style={metaValueStyle}>{weeks}</span>
          </div>
          <div style={metaItemStyle}>
            <span style={metaLabelStyle}>Dias/sem.</span>
            <span style={metaValueStyle}>{daysPerWeek}x</span>
          </div>
          <div style={metaItemStyle}>
            <span style={metaLabelStyle}>Alunos</span>
            <span style={metaValueStyle}>{students}</span>
          </div>
        </div>

        <div style={footerRowStyle}>
          <p style={priceStyle}>
            R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <div style={ratingStyle}>
            <span style={{ color: "#f59e0b", fontSize: fontSize.base }}>★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
