import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";

type StudentStatus = "active" | "past_due" | "cancelled" | "expired";

interface StudentRowProps {
  name: string;
  program: string;
  status: StudentStatus;
  progress: number;
  delay?: number;
}

const statusConfig: Record<
  StudentStatus,
  { label: string; variant: "success" | "warning" | "error" | "neutral" }
> = {
  active: { label: "Ativo", variant: "success" },
  past_due: { label: "Atrasado", variant: "warning" },
  cancelled: { label: "Cancelado", variant: "error" },
  expired: { label: "Expirado", variant: "neutral" },
};

const avatarGradients: string[][] = [
  [colors.primary[400], colors.primary[600]],
  [colors.statGradients.students[0], colors.statGradients.students[1]],
  [colors.statGradients.programs[0], colors.statGradients.programs[1]],
  [colors.statGradients.rating[0], colors.statGradients.rating[1]],
];

function getGradientByName(name: string): string[] {
  const index = name.charCodeAt(0) % avatarGradients.length;
  return avatarGradients[index];
}

export const StudentRow: React.FC<StudentRowProps> = ({
  name,
  program,
  status,
  progress,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(f, [0, 12], [-24, 0], {
    extrapolateRight: "clamp",
  });

  const gradient = getGradientByName(name);
  const initial = name.charAt(0).toUpperCase();
  const statusCfg = statusConfig[status];

  const rowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    paddingLeft: spacing[5],
    paddingRight: spacing[5],
    borderBottom: `1px solid ${colors.gray[100]}`,
    opacity,
    transform: `translateX(${translateX}px)`,
    backgroundColor: colors.white,
  };

  const avatarStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: fonts.display,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  };

  const infoColStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const programStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    color: colors.gray[400],
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const progressColStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: spacing[1],
    width: 120,
    flexShrink: 0,
  };

  const progressLabelStyle: React.CSSProperties = {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
    textAlign: "right" as const,
  };

  return (
    <div style={rowStyle}>
      <div style={avatarStyle}>{initial}</div>

      <div style={infoColStyle}>
        <span style={nameStyle}>{name}</span>
        <span style={programStyle}>{program}</span>
      </div>

      <div style={{ flexShrink: 0 }}>
        <Badge label={statusCfg.label} variant={statusCfg.variant} />
      </div>

      <div style={progressColStyle}>
        <span style={progressLabelStyle}>{progress}%</span>
        <ProgressBar
          progress={progress}
          delay={delay + 8}
          height={6}
          color={status === "active" ? colors.primary[500] : colors.gray[300]}
        />
      </div>
    </div>
  );
};
