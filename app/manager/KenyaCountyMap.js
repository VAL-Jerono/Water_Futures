"use client";

import { useMemo, useState } from "react";
import boundaries from "../../data/kenya-counties.json";

const TIER_COLORS = {
  Critical: "#EF4444",
  High: "#F97316",
  Moderate: "#EAB308",
  Low: "#22C55E",
};

const NAME_ALIASES = {
  Tharaka: "Tharaka-Nithi",
  "Taita Taveta": "Taita-Taveta",
};

const WIDTH = 800;
const HEIGHT = 620;
const PADDING = 18;

const countyName = (feature) => NAME_ALIASES[feature.properties.shapeName] || feature.properties.shapeName;

function coordinatesFromGeometry(geometry) {
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(Infinity);
  }
  return [];
}

function projectFeatures(features) {
  const coordinates = features.flatMap((feature) => coordinatesFromGeometry(feature.geometry));
  const longitudes = coordinates.filter((_, index) => index % 2 === 0);
  const latitudes = coordinates.filter((_, index) => index % 2 === 1);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const scale = Math.min(
    (WIDTH - PADDING * 2) / (maxLongitude - minLongitude),
    (HEIGHT - PADDING * 2) / (maxLatitude - minLatitude)
  );
  const offsetX = (WIDTH - (maxLongitude - minLongitude) * scale) / 2;
  const offsetY = (HEIGHT - (maxLatitude - minLatitude) * scale) / 2;

  const project = ([longitude, latitude]) => [
    offsetX + (longitude - minLongitude) * scale,
    offsetY + (maxLatitude - latitude) * scale,
  ];

  const ringPath = (ring) => ring.map((point, index) => {
    const [x, y] = project(point);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ") + " Z";

  const geometryPath = (geometry) => {
    if (geometry.type === "Polygon") {
      return geometry.coordinates.map(ringPath).join(" ");
    }
    return geometry.coordinates.flatMap((polygon) => polygon.map(ringPath)).join(" ");
  };

  return features.map((feature) => ({
    ...feature,
    county: countyName(feature),
    path: geometryPath(feature.geometry),
  }));
}

export default function KenyaCountyMap({ counties, filteredCountyNames, onSelect }) {
  const [tooltip, setTooltip] = useState(null);
  const paths = useMemo(() => projectFeatures(boundaries.features), []);
  const countyByName = useMemo(() => new Map(counties.map((county) => [county.county, county])), [counties]);
  const visibleNames = useMemo(() => new Set(filteredCountyNames), [filteredCountyNames]);

  const showTooltip = (event, county) => {
    const rect = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    const data = countyByName.get(county);
    setTooltip({
      county: data,
      x: (event.clientX || rect.left + rect.width / 2) - rect.left,
      y: (event.clientY || rect.top + rect.height / 2) - rect.top,
    });
  };

  return (
    <section className="county-map-card" aria-label="Kenya county urgency map">
      <div className="county-map-header">
        <div>
          <div className="county-map-title">County urgency map</div>
          <div className="county-map-subtitle">Hover for county risk details. Select a county to open its full profile.</div>
        </div>
        <div className="county-map-legend">
          {Object.entries(TIER_COLORS).map(([tier, color]) => (
            <span key={tier}><i style={{ backgroundColor: color }} />{tier}</span>
          ))}
          <span><i className="map-legend-missing" />No match</span>
        </div>
      </div>

      <div className="county-map-stage">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Interactive choropleth map of Kenya counties"
          onMouseLeave={() => setTooltip(null)}
        >
          {paths.map((feature) => {
            const data = countyByName.get(feature.county);
            const isVisible = visibleNames.has(feature.county);
            const fill = data ? TIER_COLORS[data.urgencyTier] || "var(--text-muted)" : "#334155";
            return (
              <path
                key={feature.properties.shapeID}
                d={feature.path}
                fill={fill}
                fillOpacity={data && isVisible ? 0.88 : data ? 0.22 : 0.5}
                stroke="rgba(226, 242, 255, 0.85)"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
                className="county-map-shape"
                tabIndex={data ? 0 : -1}
                aria-label={data ? `${data.county}, ${data.urgencyTier}` : `${feature.county}, no data`}
                onMouseMove={(event) => showTooltip(event, feature.county)}
                onFocus={(event) => showTooltip(event, feature.county)}
                onClick={() => data && onSelect(data)}
              />
            );
          })}
        </svg>

        {tooltip?.county && (
          <div className="county-map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <strong>{tooltip.county.county}</strong>
            <span className="map-tooltip-tier" style={{ color: TIER_COLORS[tooltip.county.urgencyTier] }}>
              {tooltip.county.urgencyTier}
            </span>
            <span>Urgency score: {tooltip.county.urgencyScore.toFixed(3)}</span>
            <span>Predicted risk: {(tooltip.county.meanPredRisk * 100).toFixed(1)}%</span>
            <span>Affected population: {tooltip.county.citizensDisrupted2026.toLocaleString()}</span>
          </div>
        )}
      </div>
    </section>
  );
}
