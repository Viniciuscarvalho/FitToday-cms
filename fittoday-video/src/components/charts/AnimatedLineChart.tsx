import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { lineDraw, fadeIn } from "../../utils/animations";

interface DataPoint {
  label: string;
  value: number;
}

interface AnimatedLineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  lineColor?: string;
  delay?: number;
  showArea?: boolean;
}

const AXIS_LABEL_HEIGHT = 40;
const Y_AXIS_WIDTH = 56;
const Y_TICK_COUNT = 5;
const DRAW_DURATION = 50;

// Approximate polyline total length
function polylineLength(points: { x: number; y: number }[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

export const AnimatedLineChart: React.FC<AnimatedLineChartProps> = ({
  data,
  width = 600,
  height = 300,
  lineColor = colors.primary[500],
  delay = 0,
  showArea = false,
}) => {
  const frame = useCurrentFrame();

  const chartHeight = height - AXIS_LABEL_HEIGHT;
  const chartWidth = width - Y_AXIS_WIDTH;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const yMax = Math.ceil(maxValue * 1.1);

  const yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, i) =>
    Math.round((yMax / Y_TICK_COUNT) * i)
  );

  // Compute SVG point coordinates
  const points = data.map((d, i) => ({
    x: Y_AXIS_WIDTH + (i / (data.length - 1)) * chartWidth,
    y: chartHeight - (d.value / yMax) * chartHeight,
  }));

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const pathLength = polylineLength(points);

  const localFrame = Math.max(0, frame - delay);

  // Stroke-dashoffset animation (draws line from left to right)
  const { strokeDasharray, strokeDashoffset } = lineDraw(
    localFrame,
    pathLength,
    0,
    DRAW_DURATION
  );

  // Area path (closed polygon below the line)
  const areaPath =
    `M ${Y_AXIS_WIDTH},${chartHeight} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${chartHeight} Z`;

  const areaOpacity = interpolate(localFrame, [0, DRAW_DURATION], [0, 0.18], {
    extrapolateRight: "clamp",
  });

  const containerOpacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Dots appear after draw is complete
  const dotsOpacity = interpolate(localFrame, [DRAW_DURATION, DRAW_DURATION + 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        opacity: containerOpacity,
        pointerEvents: "none",
      }}
    >
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        {/* Y axis */}
        <line
          x1={Y_AXIS_WIDTH}
          y1={0}
          x2={Y_AXIS_WIDTH}
          y2={chartHeight}
          stroke={colors.gray[700]}
          strokeWidth={1}
        />
        {/* X axis */}
        <line
          x1={Y_AXIS_WIDTH}
          y1={chartHeight}
          x2={width}
          y2={chartHeight}
          stroke={colors.gray[700]}
          strokeWidth={1}
        />

        {/* Y axis ticks and gridlines */}
        {yTicks.map((tickVal, i) => {
          const tickY = chartHeight - (tickVal / yMax) * chartHeight;
          const tickOpacity = interpolate(
            Math.max(0, localFrame - i * 2),
            [0, 8],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          return (
            <g key={tickVal} opacity={tickOpacity}>
              <line
                x1={Y_AXIS_WIDTH}
                y1={tickY}
                x2={width}
                y2={tickY}
                stroke={colors.gray[800]}
                strokeWidth={1}
                strokeDasharray={tickVal === 0 ? "none" : "4 4"}
              />
              <text
                x={Y_AXIS_WIDTH - 8}
                y={tickY + 4}
                textAnchor="end"
                fontFamily={fonts.body}
                fontSize={fontSize.xs}
                fill={colors.gray[500]}
              >
                {tickVal >= 1000
                  ? `${(tickVal / 1000).toFixed(1)}k`
                  : tickVal}
              </text>
            </g>
          );
        })}

        {/* Filled area under line */}
        {showArea && (
          <path
            d={areaPath}
            fill={lineColor}
            opacity={areaOpacity}
          />
        )}

        {/* Animated polyline */}
        <polyline
          points={polylineStr}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 4px ${lineColor}60)` }}
        />

        {/* Data point dots */}
        {points.map((p, i) => {
          const dotScale = interpolate(
            Math.max(0, localFrame - DRAW_DURATION - i * 3),
            [0, 8],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          return (
            <g key={i} opacity={dotsOpacity}>
              {/* Outer ring */}
              <circle
                cx={p.x}
                cy={p.y}
                r={6 * dotScale}
                fill={lineColor + "30"}
                stroke={lineColor}
                strokeWidth={0}
              />
              {/* Inner dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={4 * dotScale}
                fill={lineColor}
                style={{ filter: `drop-shadow(0 0 3px ${lineColor}80)` }}
              />
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((d, i) => {
          const p = points[i];
          const labelOpacity = interpolate(
            Math.max(0, localFrame - DRAW_DURATION + 5),
            [0, 12],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          return (
            <text
              key={d.label}
              x={p.x}
              y={chartHeight + 22}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontSize={fontSize.xs}
              fill={colors.gray[400]}
              opacity={labelOpacity}
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
