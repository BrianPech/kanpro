"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { addLocationMapTiles, createMapPinIcon } from "./location-map-theme";

interface OnboardingLeafletMapProps {
  coordinates: [number, number] | null;
  onSelectCoordinates: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [20.9676, -89.6241]; // Mérida, Yucatán

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
    });

    addLocationMapTiles(map);

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
        icon: createMapPinIcon(),
        title: "Ubicación de la empresa",
        alt: "Ubicación de la empresa",
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
        className="kanpro-location-map relative z-0 size-full"
        role="region"
        aria-label="Mapa de ubicación de la empresa"
      />
    </div>
  );
}
