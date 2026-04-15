"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";

import { InfoTooltip } from "@/components/InfoTooltip";

export type MapPoint = {
  latitude: number;
  longitude: number;
  location: string;
  gap: number;
  severity?: "high" | "medium" | "low" | "balanced";
};

type MapViewProps = {
  points: MapPoint[];
  center?: [number, number];
};

export function MapView({ points, center }: MapViewProps) {
  if (!center) {
    return (
      <section className="relative flex h-105 items-center justify-center rounded-2xl border border-white/40 bg-white/80 px-6 text-center shadow-xl">
        <InfoTooltip
          label="About Hotspot Heatmap"
          content="Plots the selected location and stored hotspot coordinates on the map. Circle size and color reflect the gap and severity values returned by the backend."
        />
        <div>
          <p className="text-sm font-semibold text-slate-700">Map unavailable</p>
          <p className="mt-1 text-sm text-slate-500">No real coordinates are available for this analysis yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-105 overflow-hidden rounded-2xl border border-white/40 shadow-xl">
      <InfoTooltip
        label="About Hotspot Heatmap"
        content="Plots the selected location and stored hotspot coordinates on the map. Circle size and color reflect the gap and severity values returned by the backend."
      />
      <MapContainer center={center} zoom={11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((point, index) => {
          const shortage = point.gap > 0;
          const color =
            point.severity === "high"
              ? "#991b1b"
              : point.severity === "medium"
                ? "#dc2626"
                : point.severity === "low"
                  ? "#f97316"
                  : shortage
                    ? "#dc2626"
                    : "#16a34a";
          const radius = Math.max(220, Math.min(Math.abs(point.gap) * 22, 1500));
          return (
            <Circle
              key={`${point.location}-${index}`}
              center={[point.latitude, point.longitude]}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35 }}
              radius={radius}
            >
              <Popup>
                <p className="font-semibold capitalize">{point.location}</p>
                <p>Gap: {point.gap.toFixed(2)}</p>
                <p>Status: {point.severity ?? (shortage ? "shortage" : "balanced")}</p>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </section>
  );
}
