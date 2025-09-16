import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";

interface BubbleData {
  region: string;
  lat: number;
  lon: number;
  revenue: number;
  spend: number;
}

interface BubbleMapProps {
  data: BubbleData[];
  valueType: "revenue" | "spend";
  title: string;
  className?: string;
  height?: number;
}

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
export function BubbleMap({
  data,
  valueType,
  title,
  className = "",
  height = 400,
}: BubbleMapProps) {
  console.log("Bubble Data:", data); // Debug

  // Calculate min and max for sizing and coloring
  const values = data.map((item) =>
    valueType === "revenue" ? item.revenue : item.spend
  );
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Size scale: bubbles from 5 to 30 radius
  const sizeScale = scaleLinear().domain([minValue, maxValue]).range([5, 30]);

  // Color scale: green (low) to red (high), with yellow/orange in between
  const colorScale = scaleLinear<string>()
    .domain([minValue, (minValue + maxValue) / 2, maxValue])
    .range(["#00ff00", "#ffff00", "#ff0000"]); // Green -> Yellow -> Red

  // Custom tooltip state (object with only relevant metric)
  const [tooltipContent, setTooltipContent] = useState<{
    region: string;
    value: number;
    metric: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (
    e: React.MouseEvent,
    region: string,
    revenue: number,
    spend: number
  ) => {
    console.log("Mouse Enter:", { region, revenue, spend }); // Debug
    const value = valueType === "revenue" ? revenue : spend;
    const metric = valueType === "revenue" ? "Revenue" : "Spend";
    setTooltipContent({ region, value, metric });
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    console.log("Mouse Leave"); // Debug
    setTooltipContent(null);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${className}`}
      style={{ position: "relative" }}
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {title}
      </h2>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [50, 25], // Center on Middle East (GCC region)
          scale: 400, // Zoom level for GCC focus
        }}
        width={800}
        height={height}
      >
        <ZoomableGroup zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#EAEAEC" // Light gray for map background
                  stroke="#D6D6DA" // Borders
                />
              ))
            }
          </Geographies>
          {data.map((item) => {
            const value = valueType === "revenue" ? item.revenue : item.spend;
            const size = minValue === maxValue ? 10 : sizeScale(value); // Fallback size
            return (
              <Marker
                key={item.region}
                coordinates={[item.lon, item.lat]}
                onMouseEnter={(e) =>
                  handleMouseEnter(e, item.region, item.revenue, item.spend)
                }
                onMouseLeave={handleMouseLeave}
              >
                <circle
                  r={size}
                  fill={colorScale(value)}
                  stroke="#fff"
                  strokeWidth={1}
                  style={{ opacity: 0.8 }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      {tooltipContent && (
        <div
          style={{
            position: "fixed",
            left: Math.min(tooltipPosition.x + 10, window.innerWidth - 200),
            top: Math.min(tooltipPosition.y + 10, window.innerHeight - 100),
            background: "white",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            pointerEvents: "none",
            zIndex: 1000,
            color: "black",
          }}
        >
          <strong>{tooltipContent.region}</strong>
          <br />
          {tooltipContent.metric}: ${tooltipContent.value.toLocaleString()}
        </div>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Bubble size proportional to {valueType}. Color: Green (low) to Red
        (high). GCC-focused view.
      </p>
    </div>
  );
}
