import React from "react";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "elite";

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

interface VariantConfig {
  backgroundColor: string;
  color: string;
  background?: string;
}

const variantConfigs: Record<BadgeVariant, VariantConfig> = {
  success: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    color: "#16a34a",
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    color: "#b45309",
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    color: "#dc2626",
  },
  info: {
    backgroundColor: "rgba(59, 130, 246, 0.14)",
    color: "#2563eb",
  },
  neutral: {
    backgroundColor: "rgba(107, 114, 128, 0.14)",
    color: colors.gray[600],
  },
  elite: {
    backgroundColor: "transparent",
    color: colors.white,
    background: "linear-gradient(90deg, #a855f7, #d946ef)",
  },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant }) => {
  const config = variantConfigs[variant];

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: borderRadius.full,
    backgroundColor: config.backgroundColor,
    background: config.background ?? config.backgroundColor,
    color: config.color,
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap" as const,
    lineHeight: 1,
  };

  return <span style={badgeStyle}>{label}</span>;
};
