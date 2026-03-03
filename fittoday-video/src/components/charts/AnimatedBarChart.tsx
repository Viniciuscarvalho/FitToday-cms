import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "../../theme/colors";
import { fonts, fontSize, fontWeight } from "../../theme/typography";
import { barGrow, stagger, fadeIn } from "../../utils/animations";

interface DataPoint {
  label: string;
  value: number;
}

interface AnimatedBarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  barColor?: string;
  delay?: number;
}

const AXIS_LABEL_HEIGHT = 40;
const Y_AXIS_WIDTH = 50;
const BAR_GROW_DURATION = 25;
const Y_TICK_COUNT = 5;

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  width = 600,
  height = 300,
  barColor = colors.teal[600],
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  const chartHeight = height - AXIS_LABEL_HEIGHT;
  const chartWidth = width - Y_AXIS_WIDTH;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  // Round up max for a clean Y axis
  const yMax = Math.ceil(maxValue * 1.1);

  const barAreaWidth = chartWidth / data.length;
  const barWidth = Math.max(barAreaWidth * 0.55, 16);
  const barGap = barAreaWidth - barWidth;

  // Y axis tick values
  const yTicks = Array.from({ length: Y_TICK_COUNT + 1 }, (_, i) =>
    Math.round((yMax / Y_TICK_COUNT) * i)
  );

  const containerOpacity = interpolate(Math.max(0, frame - delay), [0, 10], [0, 1], {
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
        {/* Y axis line */}
        <line
          x1={Y_AXIS_WIDTH}
          y1={0}
          x2={Y_AXIS_WIDTH}
          y2={chartHeight}
          stroke={colors.gray[700]}
          strokeWidth={1}
        />
        {/* X axis line */}
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
          const tickOpacity = interpolate(Math.max(0, frame - delay - i * 3), [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });
          return (
            <g key={tickVal} opacity={tickOpacity}>
              {/* Gridline */}
              <line
                x1={Y_AXIS_WIDTH}
                y1={tickY}
                x2={width}
                y2={tickY}
                stroke={colors.gray[800]}
                strokeWidth={1}
                strokeDasharray={tickVal === 0 ? "none" : "4 4"}
              />
              {/* Tick label */}
              <text
                x={Y_AXIS_WIDTH - 8}
                y={tickY + 4}
                textAnchor="end"
                fontFamily={fonts.body}
                fontSize={fontSize.xs}
                fill={colors.gray[500]}
              >
                {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : tickVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barDelay = delay + stagger(i, 10, 8);
          const targetBarH = (d.value / yMax) * chartHeight;
          const currentBarH = barGrow(frame, targetBarH, barDelay, BAR_GROW_DURATION);

          const barX = Y_AXIS_WIDTH + i * barAreaWidth + barGap / 2;
          const barY = chartHeight - currentBarH;

          const labelOpacity = interpolate(
            Math.max(0, frame - (barDelay + BAR_GROW_DURATION)),
            [0, 10],
            [0, 1],
            { extrapolateRight: "clamp" }
          );

          // Value label above bar
          const valueLabel =
            d.value >= 1000
              ? `${(d.value / 1000).toFixed(1)}k`
              : d.value.toString();

          // Gradient ID per bar for unique colors
          const gradId = `bar-grad-${i}`;
          const barColorLight = barColor + "CC";

          return (
            <g key={d.label}>
              {/* Bar gradient definition */}
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColorLight} />
                  <stop offset="100%" stopColor={barColor} />
                </linearGradient>
              </defs>

              {/* Bar rectangle */}
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={currentBarH}
                fill={`url(#${gradId})`}
                rx={4}
                ry={4}
              />

              {/* Value label above bar */}
              <text
                x={barX + barWidth / 2}
                y={barY - 6}
                textAnchor="middle"
                fontFamily={fonts.body}
                fontSize={fontSize.xs}
                fontWeight={fontWeight.semibold}
                fill={barColor}
                opacity={labelOpacity}
              >
                {valueLabel}
              </text>

              {/* X axis label */}
              <text
                x={barX + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fontFamily={fonts.body}
                fontSize={fontSize.xs}
                fill={colors.gray[400]}
                opacity={labelOpacity}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
