import { z } from 'zod';

export const NavigateAction = z.object({
  type: z.literal('navigate'),
  destination: z.string(),
  params: z.record(z.string()).optional(),
});

export const NavigateBackAction = z.object({
  type: z.literal('navigate-back'),
});

export const OpenUrlAction = z.object({
  type: z.literal('open-url'),
  url: z.string(),
  inApp: z.boolean().default(true),
});

export const ApiCallAction = z.object({
  type: z.literal('api-call'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  endpoint: z.string(),
  body: z.record(z.unknown()).optional(),
  onSuccess: z.lazy(() => SDUIAction).optional(),
  onError: z.lazy(() => SDUIAction).optional(),
});

export const RefreshScreenAction = z.object({
  type: z.literal('refresh-screen'),
});

export const ShowSheetAction = z.object({
  type: z.literal('show-sheet'),
  title: z.string().optional(),
  content: z.lazy(() => z.any()), // SDUIComponent (resolved later to avoid circular)
  dismissable: z.boolean().default(true),
});

export const ShowAlertAction = z.object({
  type: z.literal('show-alert'),
  title: z.string(),
  message: z.string().optional(),
  actions: z.array(z.object({
    title: z.string(),
    style: z.enum(['default', 'cancel', 'destructive']).default('default'),
    action: z.lazy(() => SDUIAction).optional(),
  })),
});

export const DismissAction = z.object({
  type: z.literal('dismiss'),
});

export const ShareAction = z.object({
  type: z.literal('share'),
  content: z.string(),
  url: z.string().optional(),
});

export const HapticAction = z.object({
  type: z.literal('haptic'),
  style: z.enum(['light', 'medium', 'heavy', 'success', 'error', 'warning']),
});

export const AnalyticsAction = z.object({
  type: z.literal('analytics'),
  event: z.string(),
  params: z.record(z.string()).optional(),
});

export const SDUIAction: z.ZodType = z.lazy(() =>
  z.discriminatedUnion('type', [
    NavigateAction,
    NavigateBackAction,
    OpenUrlAction,
    ApiCallAction,
    RefreshScreenAction,
    ShowSheetAction,
    ShowAlertAction,
    DismissAction,
    ShareAction,
    HapticAction,
    AnalyticsAction,
  ])
);

export type SDUIActionType = z.infer<typeof SDUIAction>;

// Action bindings — maps UI events to actions
export const ActionBindings = z.object({
  onTap: SDUIAction.optional(),
  onLongPress: SDUIAction.optional(),
  onAppear: SDUIAction.optional(),
  onDisappear: SDUIAction.optional(),
  onChange: SDUIAction.optional(),
  onSubmit: SDUIAction.optional(),
}).optional();

export type ActionBindingsType = z.infer<typeof ActionBindings>;
