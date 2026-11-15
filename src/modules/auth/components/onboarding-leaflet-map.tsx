"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface OnboardingLeafletMapProps {
  coordinates: [number, number] | null;
  onSelectCoordinates: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [20.9676, -89.6241]; // Mérida, Yucatán

function createTealPinIcon() {
  return L.divIcon({
    className: "kanpro-onboarding-pin",
    html: `
      <div style="width:32px;height:40px;display:flex;align-items:center;justify-content:center;cursor:grab;">
        <svg width="32" height="40" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px rgba(0,120,111,0.35));">
          <path d="M18 43C18 43 34 26.5 34 17C34 8.16344 26.8366 1 18 1C9.16344 1 2 8.16344 2 17C2 26.5 18 43 18 43Z" fill="#00786F" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="18" cy="17" r="5.5" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 39],
  });
}

export function OnboardingLeafletMap({
  coordinates,
  onSelectCoordinates,
}: OnboardingLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelectCoordinates);

  useEffect(() => {
    onSelectRef.current = onSelectCoordinates;
  }, [onSelectCoordinates]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const initialCenter = coordinates ?? DEFAULT_CENTER;
    const map = L.map(container, {
      center: initialCenter,
      zoom: coordinates ? 15 : 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onSelectRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!coordinates) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const [lat, lng] = coordinates;

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: createTealPinIcon(),
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onSelectRef.current(pos.lat, pos.lng);
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [coordinates]);

  return (
    <div className="relative h-[218px] w-full rounded-[12px] border border-border bg-muted/50 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full w-full z-0 dark:[&_.leaflet-tile-pane]:brightness-[0.78] dark:[&_.leaflet-tile-pane]:contrast-[1.08] dark:[&_.leaflet-tile-pane]:invert dark:[&_.leaflet-tile-pane]:hue-rotate-180"
      />
    </div>
  );
}
