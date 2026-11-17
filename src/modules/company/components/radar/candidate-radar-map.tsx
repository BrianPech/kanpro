"use client";

import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { addLocationMapTiles } from "@/modules/auth/components/location-map-theme";
import { GEO_CONFIG } from "@/config/geo";
import { parseLocation } from "@/lib/formatters";
import type { CandidateDirectoryItem } from "./candidate-radar-view";

interface CandidateRadarMapProps {
  candidates: CandidateDirectoryItem[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

interface CityCluster {
  city: string;
  lat: number;
  lng: number;
  count: number;
}

const DEFAULT_CENTER: [number, number] = [20.6296, -87.0739];

export function CandidateRadarMap({
  candidates,
  selectedCity,
  onSelectCity,
}: CandidateRadarMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectCityRef = useRef(onSelectCity);

  useEffect(() => {
    onSelectCityRef.current = onSelectCity;
  }, [onSelectCity]);

  const clusters = useMemo<CityCluster[]>(() => {
    const byCity = new Map<string, CityCluster>();

    for (const cand of candidates) {
      const rawLocation = cand.location || cand.preferred_zone || "";
      if (!rawLocation.trim()) continue;

      const { city } = parseLocation(rawLocation);
      const cityInfo = GEO_CONFIG[city];
      if (!cityInfo) continue;

      const existing = byCity.get(city);
      if (existing) {
        existing.count += 1;
      } else {
        byCity.set(city, {
          city,
          lat: cityInfo.coords.lat,
          lng: cityInfo.coords.lng,
          count: 1,
        });
      }
    }

    return Array.from(byCity.values());
  }, [candidates]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: DEFAULT_CENTER,
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    addLocationMapTiles(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    clusters.forEach((cluster) => {
      const isSelected = selectedCity === cluster.city;
      const pill = L.divIcon({
        className: "kanpro-radar-cluster",
        html: `<button type="button" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:700;white-space:nowrap;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.22);background:${
          isSelected ? "var(--primary, #0f766e)" : "#0b0b0b"
        };color:#ffffff;cursor:pointer;"><span>${cluster.count}</span><span style="font-weight:500;opacity:0.92;">${cluster.city
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</span></button>`,
        iconSize: [0, 0],
        iconAnchor: [0, 14],
      });

      const marker = L.marker([cluster.lat, cluster.lng], {
        icon: pill,
        title: `${cluster.city}: ${cluster.count} perfil(es)`,
      });

      marker.on("click", () => {
        onSelectCityRef.current(isSelected ? "Todas" : cluster.city);
      });

      marker.addTo(layer);
    });

    if (selectedCity !== "Todas" && GEO_CONFIG[selectedCity]) {
      const target = GEO_CONFIG[selectedCity].coords;
      map.setView([target.lat, target.lng], 12, { animate: true });
      return;
    }

    if (clusters.length === 1) {
      map.setView([clusters[0].lat, clusters[0].lng], 11, { animate: true });
      return;
    }

    if (clusters.length > 1) {
      const bounds = L.latLngBounds(clusters.map((c) => [c.lat, c.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
      return;
    }

    map.setView(DEFAULT_CENTER, 8);
  }, [clusters, selectedCity]);

  return (
    <div
      ref={containerRef}
      aria-label="Mapa de ubicación de candidatos"
      className="h-[260px] sm:h-[300px] w-full rounded-[12px] overflow-hidden border border-border bg-muted/30 z-0"
    />
  );
}
