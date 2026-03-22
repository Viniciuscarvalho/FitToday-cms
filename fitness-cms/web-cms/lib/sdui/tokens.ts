import { z } from 'zod';

// Spacing tokens — mapped to platform-specific points/dp
export const SpacingToken = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl']);
export type SpacingTokenType = z.infer<typeof SpacingToken>;

// Semantic color tokens — resolved per-platform/theme
export const ColorToken = z.enum([
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'error',
  'success',
  'warning',
  'info',
  'muted',
  'on-primary',
  'on-secondary',
  'on-surface',
  'on-background',
  'text-primary',
  'text-secondary',
  'text-tertiary',
  'border',
  'divider',
]);
export type ColorTokenType = z.infer<typeof ColorToken>;

// Corner radius tokens
export const RadiusToken = z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']);
export type RadiusTokenType = z.infer<typeof RadiusToken>;

// Shadow tokens
export const ShadowToken = z.enum(['none', 'sm', 'md', 'lg']);
export type ShadowTokenType = z.infer<typeof ShadowToken>;

// Text style tokens — maps to iOS Dynamic Type / Android Material text styles
export const TextStyleToken = z.enum([
  'large-title',
  'title-1',
  'title-2',
  'title-3',
  'headline',
  'body',
  'body-bold',
  'callout',
  'subheadline',
  'footnote',
  'caption-1',
  'caption-2',
]);
export type TextStyleTokenType = z.infer<typeof TextStyleToken>;

// Alignment tokens
export const HorizontalAlignment = z.enum(['leading', 'center', 'trailing', 'stretch']);
export const VerticalAlignment = z.enum(['top', 'center', 'bottom', 'stretch']);

// Content mode for images
export const ContentMode = z.enum(['fill', 'fit']);

// Component style — shared across all components
export const ComponentStyle = z.object({
  padding: SpacingToken.optional(),
  paddingHorizontal: SpacingToken.optional(),
  paddingVertical: SpacingToken.optional(),
  margin: SpacingToken.optional(),
  backgroundColor: ColorToken.optional(),
  cornerRadius: RadiusToken.optional(),
  shadow: ShadowToken.optional(),
  border: z.object({
    color: ColorToken,
    width: z.number().default(1),
  }).optional(),
  opacity: z.number().min(0).max(1).optional(),
  isHidden: z.boolean().optional(),
}).optional();

export type ComponentStyleType = z.infer<typeof ComponentStyle>;
