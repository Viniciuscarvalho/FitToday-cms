import React from "react";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/spacing";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: React.CSSProperties;
}

interface SizeConfig {
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  borderRadius: number;
}

const sizeConfigs: Record<ButtonSize, SizeConfig> = {
  sm: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    fontSize: fontSize.sm,
    borderRadius: borderRadius.lg,
  },
  md: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    fontSize: fontSize.base,
    borderRadius: borderRadius.xl,
  },
  lg: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    fontSize: fontSize.lg,
    borderRadius: borderRadius["2xl"],
  },
};

interface VariantConfig {
  backgroundColor: string;
  color: string;
  border?: string;
  background?: string;
}

const variantConfigs: Record<ButtonVariant, VariantConfig> = {
  primary: {
    background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
    backgroundColor: colors.primary[500],
    color: colors.white,
  },
  secondary: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
  outline: {
    backgroundColor: "transparent",
    color: colors.primary[600],
    border: `2px solid ${colors.primary[500]}`,
  },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = "primary",
  size = "md",
  style,
}) => {
  const sizeConfig = sizeConfigs[size];
  const variantConfig = variantConfigs[variant];

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: sizeConfig.paddingVertical,
    paddingBottom: sizeConfig.paddingVertical,
    paddingLeft: sizeConfig.paddingHorizontal,
    paddingRight: sizeConfig.paddingHorizontal,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: variantConfig.backgroundColor,
    background: variantConfig.background ?? variantConfig.backgroundColor,
    color: variantConfig.color,
    border: variantConfig.border ?? "none",
    fontFamily: fonts.body,
    fontSize: sizeConfig.fontSize,
    fontWeight: fontWeight.semibold,
    letterSpacing: "0.01em",
    cursor: "pointer",
    boxShadow:
      variant === "primary"
        ? `0 4px 14px rgba(16, 185, 129, 0.35)`
        : "none",
    whiteSpace: "nowrap" as const,
    ...style,
  };

  return <button style={buttonStyle}>{label}</button>;
};
