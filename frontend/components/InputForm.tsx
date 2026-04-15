"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";

import { findLocationMatches, resolveLocationCoordinates } from "@/lib/location-coordinates";

const CoordinateMapPreview = dynamic(
  () => import("@/components/CoordinateMapPreview").then((mod) => mod.CoordinateMapPreview),
  { ssr: false }
);

export type InputFormValues = {
  hour: number;
  location: string;
  latitude?: number;
  longitude?: number;
};

type InputFormProps = {
  loading?: boolean;
  initialValues?: Partial<InputFormValues>;
  onSubmit: (values: InputFormValues) => void;
};

const STORAGE_KEY = "kapido:last-analysis";

type StoredAnalysis = InputFormValues;

function displayLocation(location: string): string {
  return location
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

function readStoredAnalysis(): StoredAnalysis | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredAnalysis;
  } catch {
    return null;
  }
}

export function InputForm({ loading, initialValues, onSubmit }: InputFormProps) {
  const stored = readStoredAnalysis();
  const initialLocation = displayLocation(initialValues?.location ?? stored?.location ?? "chittoor");
  const suggestionListId = useId();
  const [hour, setHour] = useState<number>(initialValues?.hour ?? stored?.hour ?? 8);
  const [location, setLocation] = useState<string>(initialLocation);
  const [latitude, setLatitude] = useState<number>(initialValues?.latitude ?? stored?.latitude ?? 0);
  const [longitude, setLongitude] = useState<number>(initialValues?.longitude ?? stored?.longitude ?? 0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>("");

  const matches = useMemo(() => findLocationMatches(location, 8), [location]);
  const isCurrentLocation = location.trim().toLowerCase() === "current location";
  const resolvedCoordinates = useMemo(() => resolveLocationCoordinates(location), [location]);
  const activeCoordinates = useMemo(() => {
    if (resolvedCoordinates) {
      return resolvedCoordinates;
    }

    if (isCurrentLocation) {
      return [latitude, longitude] as const;
    }

    return null;
  }, [resolvedCoordinates, isCurrentLocation, latitude, longitude]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: StoredAnalysis = {
      hour,
      location,
      latitude: activeCoordinates?.[0],
      longitude: activeCoordinates?.[1],
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hour, location, activeCoordinates]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const safeLocation = location.trim();

    if (!activeCoordinates) {
      setLocationError("Choose a suggested location or use current location before submitting.");
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ hour, location: safeLocation, latitude: activeCoordinates[0], longitude: activeCoordinates[1] }),
    );
    onSubmit({
      hour,
      location: safeLocation,
      latitude: activeCoordinates[0],
      longitude: activeCoordinates[1],
    });
  };

  const handleUseCurrentLocation = () => {
    if (!window.navigator.geolocation) {
      setLocationError("This browser does not support location access.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude;
        const nextLongitude = position.coords.longitude;

        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setLocation("current location");
        setShowSuggestions(false);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access was denied. Allow permission or type your area manually.");
          return;
        }

        setLocationError("Unable to fetch your current location right now.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur">
      <div>
        <label className="block text-sm font-semibold text-slate-700">Hour of day (0-23)</label>
        <input
          type="range"
          min={0}
          max={23}
          value={hour}
          onChange={(event) => setHour(Number(event.target.value))}
          className="mt-2 w-full accent-emerald-600"
        />
        <p className="text-sm text-slate-600">Selected hour: {hour}:00</p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-slate-700">Area ID / location</label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading || isLocating}
            className="rounded-sm cursor-pointer border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocating ? "Locating..." : "Use current location"}
          </button>
        </div>
        <input
          required
          value={location}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            window.setTimeout(() => setShowSuggestions(false), 120);
          }}
          onChange={(event) => {
            const nextLocation = event.target.value;
            setLocation(nextLocation);
            setLocationError("");
            const resolved = resolveLocationCoordinates(nextLocation);
            if (resolved) {
              setLatitude(resolved[0]);
              setLongitude(resolved[1]);
            }
            setShowSuggestions(true);
          }}
          placeholder="downtown"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${suggestionListId}-listbox`}
          aria-expanded={showSuggestions && matches.length > 0}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
        />
        {showSuggestions && matches.length > 0 && (
          <div id={`${suggestionListId}-listbox`} className="relative z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <ul className="max-h-64 overflow-auto py-1">
              {matches.map((match) => (
                <li key={match.key}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-emerald-50"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setLocation(match.label);
                      setLatitude(match.coordinates[0]);
                      setLongitude(match.coordinates[1]);
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="font-medium text-slate-800">{match.label}</span>
                    <span className="text-xs text-slate-500">{match.key}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeCoordinates ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing {matches.length} match{matches.length === 1 ? "" : "es"} for {location ? `"${location}"` : "your input"}.
          </p>
        ) : isCurrentLocation ? (
          <p className="mt-2 text-xs text-slate-500">Using your current GPS coordinates.</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Pick a suggested location or use current location to preview the map.</p>
        )}
        {locationError && <p className="mt-1 text-xs font-medium text-rose-600">{locationError}</p>}
      </div>

      {activeCoordinates ? (
        <CoordinateMapPreview
          latitude={activeCoordinates[0]}
          longitude={activeCoordinates[1]}
          location={location.trim()}
          onPositionChange={(nextLatitude, nextLongitude) => {
            setLatitude(nextLatitude);
            setLongitude(nextLongitude);
          }}
        />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-700">Map preview unavailable</p>
          <p className="text-xs text-slate-500">No real coordinates are attached to the typed location yet.</p>
        </section>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Running prediction..." : "Analyze demand-supply gap"}
      </button>
    </form>
  );
}
