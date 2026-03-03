import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fadeIn } from "../../utils/animations";

interface ArrowPointerProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay?: number;
  color?: string;
}

// Compute quadratic bezier control point (perpendicular offset from midpoint)
function getControlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 60
): { cx: number; cy: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular unit vector
  const px = -dy / len;
  const py = dx / len;
  return { cx: mx + px * curvature, cy: my + py * curvature };
}

// Approximate quadratic bezier path length via sampling
function approxBezierLength(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  steps: number = 40
): number {
  let length = 0;
  let px = x1;
  let py = y1;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const nx = mt * mt * x1 + 2 * mt * t * cx + t * t * x2;
    const ny = mt * mt * y1 + 2 * mt * t * cy + t * t * y2;
    const ddx = nx - px;
    const ddy = ny - py;
    length += Math.sqrt(ddx * ddx + ddy * ddy);
    px = nx;
    py = ny;
  }
  return length;
}

// Arrowhead marker: compute endpoint direction from bezier tangent at t=1
function getArrowHeadPoints(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  size: number = 12
): string {
  // Tangent at t=1: 2*(P2-P1) where P2=endpoint, P1=controlPoint
  const tx = 2 * (x2 - cx);
  const ty = 2 * (y2 - cy);
  const len = Math.sqrt(tx * tx + ty * ty) || 1;
  const ux = tx / len;
  const uy = ty / len;
  // Perpendicular
  const px = -uy;
  const py = ux;
  const tip = { x: x2, y: y2 };
  const left = {
    x: x2 - ux * size + px * (size / 2),
    y: y2 - uy * size + py * (size / 2),
  };
  const right = {
    x: x2 - ux * size - px * (size / 2),
    y: y2 - uy * size - py * (size / 2),
  };
  return `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

const DRAW_DURATION = 30;

export const ArrowPointer: React.FC<ArrowPointerProps> = ({
  startX,
  startY,
  endX,
  endY,
  delay = 0,
  color = colors.primary[500],
}) => {
  const frame = useCurrentFrame();

  const { cx, cy } = getControlPoint(startX, startY, endX, endY, 60);
  const pathLength = approxBezierLength(startX, startY, cx, cy, endX, endY);
  const arrowHeadPoints = getArrowHeadPoints(startX, startY, cx, cy, endX, endY, 12);

  const localFrame = Math.max(0, frame - delay);

  // Stroke dashoffset animates from pathLength -> 0 (draws the line)
  const strokeDashoffset = interpolate(
    localFrame,
    [0, DRAW_DURATION],
    [pathLength, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Arrowhead appears after line is mostly drawn
  const arrowHeadOpacity = interpolate(localFrame, [DRAW_DURATION - 5, DRAW_DURATION + 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerOpacity = interpolate(localFrame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pathD = `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;

  const svgMinX = Math.min(startX, cx, endX) - 20;
  const svgMinY = Math.min(startY, cy, endY) - 20;
  const svgWidth = Math.max(startX, cx, endX) - svgMinX + 20;
  const svgHeight = Math.max(startY, cy, endY) - svgMinY + 20;

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        pointerEvents: "none",
        opacity: containerOpacity,
      }}
      width="100%"
      height="100%"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={strokeDashoffset}
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
      <polygon
        points={arrowHeadPoints}
        fill={color}
        opacity={arrowHeadOpacity}
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
      />
    </svg>
  );
};
