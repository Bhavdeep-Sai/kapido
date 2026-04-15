"use client";

import "leaflet/dist/leaflet.css";

import { divIcon } from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

type CoordinateMapPreviewProps = {
  latitude: number;
  longitude: number;
  location: string;
  onPositionChange: (latitude: number, longitude: number) => void;
};

function MapClickHandler({ onPositionChange }: Pick<CoordinateMapPreviewProps, "onPositionChange">) {
  useMapEvents({
    click(event) {
      onPositionChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapPositionUpdater({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);

  return null;
}

export function CoordinateMapPreview({ latitude, longitude, location, onPositionChange }: CoordinateMapPreviewProps) {
  const position: [number, number] = [latitude, longitude];
  const pinIcon = useMemo(
    () =>
      divIcon({
        className: "",
        html: '<div style="width:16px;height:16px;border-radius:9999px;background:#0f766e;border:2px solid #ccfbf1;box-shadow:0 0 0 3px rgba(15,118,110,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    [],
  );

  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-sm font-semibold text-slate-700">Map location</p>
      <p className="text-xs text-slate-500">Drag the pin or click anywhere on the map to set the location.</p>
      <div className="h-56 overflow-hidden rounded-lg border border-slate-200">
        <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <MapPositionUpdater position={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPositionChange={onPositionChange} />
          <Marker
            position={position}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const next = event.target.getLatLng();
                onPositionChange(next.lat, next.lng);
              },
            }}
          >
            <Popup>
              <p className="font-semibold capitalize">{location || "Selected location"}</p>
              <p>Pin moved successfully.</p>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </section>
  );
}