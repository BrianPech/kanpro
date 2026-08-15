import { useState, useCallback, useMemo } from "react";
import { useThrottledValue, useThrottledCallback } from "@tanstack/react-pacer";

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula, returning the distance in kilometers.
 */
export function calculateHaversineDistance(
  coords1: GeoCoordinates,
  coords2: GeoCoordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook to throttle Haversine distance calculations for a single target position
 * (at most once every 300ms) to prevent high-frequency recalculation during location updates.
 */
export function useThrottledDistance(
  userCoords: GeoCoordinates | null,
  targetCoords: GeoCoordinates | null,
  throttleMs: number = 300
): number | null {
  const rawDistance = useMemo(() => {
    if (!userCoords || !targetCoords) return null;
    return calculateHaversineDistance(userCoords, targetCoords);
  }, [userCoords, targetCoords]);

  const [throttledDist] = useThrottledValue(rawDistance, { wait: throttleMs });
  return throttledDist;
}

/**
 * Main geolocation hook with GPS coordinate retrieval and throttled coordinate updates
 * for downstream distance calculation and candidate/vacancy sorting.
 */
export function useGeolocation(throttleWaitMs: number = 500) {
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Throttled coordinates to prevent excessive re-sorting during continuous location streaming
  const [throttledCoordinates] = useThrottledValue(coordinates, { wait: throttleWaitMs });

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("La geolocalización no está soportada por tu navegador.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let errorMsg = "Ocurrió un error al obtener la ubicación.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = "Permiso de ubicación denegado por el usuario.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = "La información de ubicación no está disponible.";
            break;
          case err.TIMEOUT:
            errorMsg = "Tiempo de espera agotado al obtener la ubicación.";
            break;
        }
        setError(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return {
    coordinates,
    throttledCoordinates,
    loading,
    error,
    requestLocation,
  };
}
