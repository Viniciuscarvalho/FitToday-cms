import { spring, interpolate, SpringConfig } from "remotion";

// Standard spring configs
export const SPRING_SNAPPY: SpringConfig = { damping: 15, stiffness: 200 };
export const SPRING_BOUNCY: SpringConfig = { damping: 12, stiffness: 180 };
export const SPRING_SMOOTH: SpringConfig = { damping: 200 };

// Fade + slide up entrance
export const fadeUpIn = (frame: number, delay: number = 0) => {
  const f = Math.max(0, frame - delay);
  return {
    opacity: interpolate(f, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(f, [0, 15], [20, 0], {
      extrapolateRight: "clamp",
    })}px)`,
  };
};

// Fade + slide from left
export const slideInLeft = (frame: number, delay: number = 0) => {
  const f = Math.max(0, frame - delay);
  return {
    opacity: interpolate(f, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateX(${interpolate(f, [0, 15], [-30, 0], {
      extrapolateRight: "clamp",
    })}px)`,
  };
};

// Fade + slide from right
export const slideInRight = (frame: number, delay: number = 0) => {
  const f = Math.max(0, frame - delay);
  return {
    opacity: interpolate(f, [0, 15], [0, 1], {
      extrapolateRight: "clamp",
    }),
    transform: `translateX(${interpolate(f, [0, 15], [30, 0], {
      extrapolateRight: "clamp",
    })}px)`,
  };
};

// Spring scale entrance (for buttons, cards)
export const springScale = (
  frame: number,
  fps: number,
  delay: number = 0,
  config: SpringConfig = SPRING_BOUNCY
) => {
  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config,
  });
  return { transform: `scale(${s})` };
};

// Stagger delay for lists
export const stagger = (
  index: number,
  baseDelay: number = 0,
  gap: number = 8
) => baseDelay + index * gap;

// Animated counter (0 -> target)
export const countUp = (
  frame: number,
  target: number,
  startFrame: number,
  duration: number = 30
) =>
  Math.round(
    interpolate(frame, [startFrame, startFrame + duration], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

// Chart bar growth
export const barGrow = (
  frame: number,
  targetHeight: number,
  startFrame: number,
  duration: number = 20
) =>
  interpolate(frame, [startFrame, startFrame + duration], [0, targetHeight], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// SVG stroke-dashoffset for line drawing
export const lineDraw = (
  frame: number,
  pathLength: number,
  startFrame: number,
  duration: number = 45
) => ({
  strokeDasharray: pathLength,
  strokeDashoffset: interpolate(
    frame,
    [startFrame, startFrame + duration],
    [pathLength, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  ),
});

// Simple fade in
export const fadeIn = (frame: number, delay: number = 0, duration: number = 15) => ({
  opacity: interpolate(Math.max(0, frame - delay), [0, duration], [0, 1], {
    extrapolateRight: "clamp",
  }),
});

// Simple fade out
export const fadeOut = (
  frame: number,
  startFrame: number,
  duration: number = 15
) => ({
  opacity: interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
});

// Pulse effect (for highlight rings)
export const pulse = (frame: number, speed: number = 0.1) =>
  1 + Math.sin(frame * speed) * 0.05;

// Typewriter effect: returns how many chars to show
export const typewriterChars = (
  frame: number,
  totalChars: number,
  startFrame: number = 0,
  charsPerFrame: number = 1.5
) =>
  Math.min(
    Math.floor(Math.max(0, frame - startFrame) * charsPerFrame),
    totalChars
  );
