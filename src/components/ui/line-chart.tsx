"use client";

import React from "react";

interface DataPoint {
  x: string; // Typically a date or label
  y: number;
}

interface LineChartProps {
  title: string;
  data: DataPoint[];
  strokeColor?: string;
  fillColor?: string;
  height?: number;
  className?: string;
  formatYLabel?: (value: number) => string;
}

export function LineChart({
  title,
  data,
  strokeColor = "#3b82f6", // blue-500
  fillColor = "rgba(59, 130, 246, 0.1)",
  height = 300,
  className = "",
  formatYLabel = (value) => value.toLocaleString(),
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        <div
          style={{ height: `${height}px` }}
          className="flex items-center justify-center text-gray-500"
        >
          No data available.
        </div>
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = 600;
  const chartHeight = height;
  const contentWidth = chartWidth - padding.left - padding.right;
  const contentHeight = chartHeight - padding.top - padding.bottom;

  const maxY = Math.max(...data.map((d) => d.y), 0);
  const scaleY = (value: number) =>
    contentHeight - (value / (maxY || 1)) * contentHeight;
  const scaleX = (index: number) => (index / (data.length - 1)) * contentWidth;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.y)}`)
    .join(" ");

  const areaPath = `${linePath} L ${scaleX(
    data.length - 1
  )} ${contentHeight} L ${scaleX(0)} ${contentHeight} Z`;

  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = (maxY / 4) * i;
    return { value, y: scaleY(value) };
  }).reverse();

  const xAxisLabels =
    data.length > 1
      ? [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]]
      : [data[0]];
  const xAxisLabelIndices =
    data.length > 1 ? [0, Math.floor(data.length / 2), data.length - 1] : [0];

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h3>
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          width="100%"
          height={height}
        >
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Y-axis grid lines and labels */}
            {yAxisLabels.map(({ value, y }) => (
              <g key={value}>
                <line
                  x1={0}
                  y1={y}
                  x2={contentWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="2,2"
                  className="dark:stroke-gray-600"
                />
                <text
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                  className="dark:fill-gray-400"
                >
                  {formatYLabel(value)}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {xAxisLabelIndices.map((index) => (
              <text
                key={index}
                x={scaleX(index)}
                y={contentHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
                className="dark:fill-gray-400"
              >
                {new Date(data[index].x).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            ))}

            {/* Area and Line */}
            <path d={areaPath} fill={fillColor} />
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
            />

            {/* Data points */}
            {data.map((d, i) => (
              <g key={i}>
                <title>{`Date: ${d.x}\nValue: ${formatYLabel(d.y)}`}</title>
                <circle
                  cx={scaleX(i)}
                  cy={scaleY(d.y)}
                  r="3"
                  fill={strokeColor}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
