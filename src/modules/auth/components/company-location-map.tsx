"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  X,
  Check,
  Building2,
  Maximize2,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GEO_CONFIG, findNearestCityAndZone, cleanCityName } from "@/config/geo";

// Coordinate dictionary generated from comprehensive Southeast Mexico GEO_CONFIG
export const SOUTHEAST_CITY_COORDS: Record<string, [number, number]> = Object.entries(
  GEO_CONFIG
).reduce((acc, [name, info]) => {
  acc[name] = [info.coords.lat, info.coords.lng];
  const stateLabel =
    info.state === "Quintana Roo"
      ? "Quintana Roo"
      : info.state === "Yucatán"
      ? "Yucatán"
      : info.state;
  acc[`${name}, ${stateLabel}`] = [info.coords.lat, info.coords.lng];
  return acc;
}, {} as Record<string, [number, number]>);

// Regional aliases and common abbreviations
SOUTHEAST_CITY_COORDS["FCP"] = [19.5775, -88.0454];
SOUTHEAST_CITY_COORDS["Felipe Carrillo Puerto, Q. Roo"] = [19.5775, -88.0454];
SOUTHEAST_CITY_COORDS["Cancún, Q. Roo"] = [21.1619, -86.8515];
SOUTHEAST_CITY_COORDS["Playa del Carmen, Q. Roo"] = [20.6296, -87.0739];
SOUTHEAST_CITY_COORDS["Tulum, Q. Roo"] = [20.2114, -87.4654];
SOUTHEAST_CITY_COORDS["Chetumal, Q. Roo"] = [18.5002, -88.2961];
SOUTHEAST_CITY_COORDS["Cozumel, Q. Roo"] = [20.5083, -86.9458];
SOUTHEAST_CITY_COORDS["Bacalar, Q. Roo"] = [18.6779, -88.3934];
SOUTHEAST_CITY_COORDS["Puerto Morelos, Q. Roo"] = [20.8494, -86.8767];

export function getCoordsForCity(cityStr?: string): [number, number] {
  if (!cityStr) return [20.9676, -89.6241];

  const cleaned = cleanCityName(cityStr);
  if (GEO_CONFIG[cleaned]) {
    return [GEO_CONFIG[cleaned].coords.lat, GEO_CONFIG[cleaned].coords.lng];
  }

  if (SOUTHEAST_CITY_COORDS[cityStr]) {
    return SOUTHEAST_CITY_COORDS[cityStr];
  }

  const lower = cityStr.toLowerCase();
  for (const [key, coords] of Object.entries(SOUTHEAST_CITY_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return coords;
    }
  }

  return [20.9676, -89.6241];
}

export interface LocationResult {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  colony?: string;
  postalCode?: string;
}

export interface CompanyLocationMapProps {
  selectedCity?: string;
  initialAddress?: string;
  initialCoordinates?: [number, number];
  onLocationChange: (result: LocationResult) => void;
  className?: string;
}

// Custom modern SVG marker for Leaflet with exact anchor positioning
function createMapPinIcon() {
  return L.divIcon({
    className: "kanpro-map-pin-marker",
    html: `
      <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab; user-select: none;">
        <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 8px rgba(37,99,235,0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <path d="M18 43C18 43 34 26.5 34 17C34 8.16344 26.8366 1 18 1C9.16344 1 2 8.16344 2 17C2 26.5 18 43 18 43Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="18" cy="17" r="6" fill="#FFFFFF"/>
          <circle cx="18" cy="17" r="3" fill="#2563EB"/>
        </svg>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 43],
    popupAnchor: [0, -43],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOG MODAL MAP (WIDE, EXPANDED FULLSCREEN VIEW)
// ─────────────────────────────────────────────────────────────────────────────
interface ExpandedMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCoords: [number, number];
  currentAddress: string;
  selectedCity: string;
  onConfirm: (result: LocationResult) => void;
}

function ExpandedMapDialog({
  open,
  onOpenChange,
  currentCoords,
  currentAddress,
  selectedCity,
  onConfirm,
}: ExpandedMapDialogProps) {
  // Callback ref to guarantee container existence even after Portal/transition mounting
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);
  const modalMarkerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<[number, number]>(currentCoords);
  const [address, setAddress] = useState<string>(currentAddress);
  const [detectedCity, setDetectedCity] = useState<string>(selectedCity);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (open) {
      setCoords(currentCoords);
      setAddress(currentAddress);
      setDetectedCity(selectedCity);
    }
  }, [open, currentCoords, currentAddress, selectedCity]);

  // Search state inside modal
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      displayName: string;
      lat: number;
      lon: number;
      road: string;
      suburb: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "es",
            },
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const rawCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.county ||
            addr.village ||
            addr.state_district ||
            "";

          // Match with known city or geometric nearest in Southeast Mexico
          let resolvedCityName = cleanCityName(rawCity);
          if (!GEO_CONFIG[resolvedCityName]) {
            const nearest = findNearestCityAndZone(lat, lng);
            resolvedCityName = nearest.city;
          }

          const cityInfo = GEO_CONFIG[resolvedCityName];
          const stateLabel = cityInfo
            ? cityInfo.state === "Quintana Roo"
              ? "Quintana Roo"
              : cityInfo.state === "Yucatán"
              ? "Yucatán"
              : cityInfo.state
            : "";
          const fullCity = stateLabel
            ? `${resolvedCityName}, ${stateLabel}`
            : resolvedCityName;

          const road = addr.road || "";
          const houseNumber = addr.house_number ? `#${addr.house_number}` : "";
          const suburb = addr.suburb || addr.neighbourhood || addr.quarter || "";
          const postcode = addr.postcode || "";

          const parts = [
            [road, houseNumber].filter(Boolean).join(" "),
            suburb,
            resolvedCityName,
            postcode ? `C.P. ${postcode}` : "",
          ].filter(Boolean);

          const formattedAddress =
            parts.length > 0 ? parts.join(", ") : data.display_name || "";

          setAddress(formattedAddress);
          setDetectedCity(fullCity);
        }
      } catch (err) {
        console.warn("Modal reverse geocode timeout or error:", err);
      } finally {
        setIsGeocoding(false);
      }
    },
    []
  );

  // Initialize modal map on mount whenever the DOM node is attached inside the Dialog
  useEffect(() => {
    if (!open || !mapContainerNode) return;

    if (modalMapRef.current) {
      modalMapRef.current.remove();
      modalMapRef.current = null;
    }

    const map = L.map(mapContainerNode, {
      center: currentCoords,
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: "center",
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker(currentCoords, {
      icon: createMapPinIcon(),
      draggable: true,
      autoPan: true,
    }).addTo(map);

    // Click anywhere on the map to set the pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords([lat, lng]);
      handleReverseGeocode(lat, lng);
    });

    // Drag pin
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCoords([pos.lat, pos.lng]);
      handleReverseGeocode(pos.lat, pos.lng);
    });

    modalMapRef.current = map;
    modalMarkerRef.current = marker;

    // Keep tiles fully sized and responsive using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerNode);

    // Trigger multiple invalidations during modal opening transitions
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      modalMapRef.current = null;
      modalMarkerRef.current = null;
    };
  }, [open, mapContainerNode, currentCoords, handleReverseGeocode]);

  // Modal Autocomplete Search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (text.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const queryWithContext = `${text}, Sureste México`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryWithContext
          )}&limit=5&countrycodes=mx&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "es",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed = data.map((item: any) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            road: item.address?.road || "",
            suburb:
              item.address?.suburb ||
              item.address?.neighbourhood ||
              item.address?.residential ||
              "",
          }));
          setSearchResults(parsed);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.warn("Modal search geocode error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (item: {
    lat: number;
    lon: number;
  }) => {
    setShowSearchResults(false);
    setSearchQuery("");
    const newCoords: [number, number] = [item.lat, item.lon];
    setCoords(newCoords);

    if (modalMapRef.current && modalMarkerRef.current) {
      modalMapRef.current.flyTo(newCoords, 17, { duration: 1.0 });
      modalMarkerRef.current.setLatLng(newCoords);
      handleReverseGeocode(item.lat, item.lon);
    }
  };

  // GPS inside modal
  const handleDetectGPSInModal = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocalización no soportada", {
        description: "Tu navegador no permite la detección de ubicación.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const newCoords: [number, number] = [latitude, longitude];
        setCoords(newCoords);

        if (modalMapRef.current && modalMarkerRef.current) {
          modalMapRef.current.flyTo(newCoords, 17, { duration: 1.0 });
          modalMarkerRef.current.setLatLng(newCoords);
          handleReverseGeocode(latitude, longitude);
          toast.success("Ubicación detectada por GPS");
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permiso de GPS denegado");
        } else {
          toast.error("No se pudo obtener tu ubicación GPS");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    onConfirm({
      address: address || currentAddress,
      city: detectedCity || selectedCity,
      latitude: coords[0],
      longitude: coords[1],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl sm:max-w-5xl lg:max-w-6xl h-[90dvh] max-h-[94dvh] p-3.5 sm:p-6 flex flex-col gap-3 rounded-2xl sm:rounded-3xl overflow-hidden bg-background border border-border/80 shadow-2xl">
        <DialogHeader className="gap-1 pb-0.5 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <MapPin className="size-5 text-primary shrink-0" />
            <span>Selector Preciso de Ubicación</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Haz clic en cualquier punto del mapa o arrastra el pin para fijar la ubicación exacta de tu empresa.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Search and GPS Controls Bar */}
        <div className="relative w-full flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {isSearching ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Search className="size-3.5" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              placeholder="Buscar calle, colonia, fraccionamiento o parque..."
              className="w-full h-10 pl-9 pr-8 rounded-xl bg-card border border-input text-foreground text-xs shadow-2xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none transition-all placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="size-3" />
              </button>
            )}

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                <div className="p-1 space-y-0.5">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/70 flex items-start gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground block truncate">
                          {item.road || item.suburb || "Ubicación"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {item.displayName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDetectGPSInModal}
            disabled={isLocating}
            className="h-10 px-3.5 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer shrink-0 border-input bg-card hover:bg-accent"
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Navigation className="size-3.5 text-primary" />
            )}
            <span>GPS</span>
          </Button>
        </div>

        {/* Modal Map Canvas - Responsive height */}
        <div className="relative flex-1 w-full min-h-[220px] sm:min-h-[360px] rounded-2xl border border-border/80 overflow-hidden bg-muted/20">
          <div
            ref={setMapContainerNode}
            className="absolute inset-0 z-0 cursor-crosshair"
          />

          {isGeocoding && (
            <div className="absolute top-3 right-3 z-10 bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground shadow-xs select-none">
              <Loader2 className="size-3 animate-spin text-primary" />
              <span>Actualizando dirección...</span>
            </div>
          )}

          <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm border border-border/60 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] text-foreground font-semibold flex items-center gap-1.5 shadow-xs pointer-events-none select-none max-w-[70%] sm:max-w-none">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">Toca o haz clic para mover el pin</span>
          </div>

          <div className="hidden sm:block absolute bottom-3 right-3 z-10 bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg px-2.5 py-1 text-[10px] font-mono text-muted-foreground shadow-xs pointer-events-none select-none">
            {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
          </div>
        </div>

        {/* Modal Footer with Address Preview & Confirm Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 shrink-0 border-t border-border/40 sticky bottom-0 bg-background/95 backdrop-blur-md">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
              <Building2 className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{address || "Sin dirección específica"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              Ciudad detectada: <span className="font-semibold text-foreground">{detectedCity}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirmLocation}
              className="h-9 px-5 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm cursor-pointer"
            >
              <Check className="size-3.5" />
              <span>Confirmar Ubicación</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT MAIN (INLINE EMBEDDABLE MAP)
// ─────────────────────────────────────────────────────────────────────────────
export function CompanyLocationMap({
  selectedCity = "Mérida, Yucatán",
  initialAddress = "",
  initialCoordinates,
  onLocationChange,
  className,
}: CompanyLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Anti-feedback loop flag: prevents internal pin updates from triggering external selectedCity flyTo
  const isInternalUpdateRef = useRef<boolean>(false);
  // Track previous selectedCity so selectedCity changes only trigger when explicitly changed by user
  const prevCityRef = useRef<string>(selectedCity);

  const [coords, setCoords] = useState<[number, number]>(() => {
    if (initialCoordinates && initialCoordinates[0] && initialCoordinates[1]) {
      return initialCoordinates;
    }
    return getCoordsForCity(selectedCity);
  });
  const [address, setAddress] = useState<string>(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      displayName: string;
      lat: number;
      lon: number;
      road: string;
      suburb: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Geocodificación inversa con OpenStreetMap Nominatim
  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "es",
            },
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const rawCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.county ||
            addr.village ||
            addr.state_district ||
            "";

          // Match with known city or geometric nearest in Southeast Mexico
          let resolvedCityName = cleanCityName(rawCity);
          if (!GEO_CONFIG[resolvedCityName]) {
            const nearest = findNearestCityAndZone(lat, lng);
            resolvedCityName = nearest.city;
          }

          const cityInfo = GEO_CONFIG[resolvedCityName];
          const stateLabel = cityInfo
            ? cityInfo.state === "Quintana Roo"
              ? "Quintana Roo"
              : cityInfo.state === "Yucatán"
              ? "Yucatán"
              : cityInfo.state
            : "";
          const fullCity = stateLabel
            ? `${resolvedCityName}, ${stateLabel}`
            : resolvedCityName;

          const road = addr.road || "";
          const houseNumber = addr.house_number ? `#${addr.house_number}` : "";
          const suburb = addr.suburb || addr.neighbourhood || addr.quarter || "";
          const postcode = addr.postcode || "";

          const parts = [
            [road, houseNumber].filter(Boolean).join(" "),
            suburb,
            resolvedCityName,
            postcode ? `C.P. ${postcode}` : "",
          ].filter(Boolean);

          const formattedAddress =
            parts.length > 0 ? parts.join(", ") : data.display_name || "";

          setAddress(formattedAddress);

          // Signal internal update before calling onLocationChange to prevent feedback loop
          isInternalUpdateRef.current = true;
          onLocationChange({
            address: formattedAddress,
            city: fullCity || selectedCity,
            latitude: lat,
            longitude: lng,
            colony: suburb,
            postalCode: postcode,
          });
        }
      } catch (err) {
        console.warn("Reverse geocode fallback or timeout:", err);
      } finally {
        setIsGeocoding(false);
      }
    },
    [onLocationChange, selectedCity]
  );

  // Inicializar Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCoords =
      initialCoordinates && initialCoordinates[0] && initialCoordinates[1]
        ? initialCoordinates
        : getCoordsForCity(selectedCity);

    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: initialCoordinates ? 16 : 14,
      zoomControl: true,
      scrollWheelZoom: "center",
      dragging: !isTouchDevice,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker(initialCoords, {
      icon: createMapPinIcon(),
      draggable: true,
      autoPan: true,
    }).addTo(map);

    // Click en el mapa para reposicionar pin inmediatamente
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords([lat, lng]);
      isInternalUpdateRef.current = true;
      handleReverseGeocode(lat, lng);
    });

    // Arrastre del pin
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCoords([pos.lat, pos.lng]);
      isInternalUpdateRef.current = true;
      handleReverseGeocode(pos.lat, pos.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    if (!initialAddress && !initialCoordinates) {
      handleReverseGeocode(initialCoords[0], initialCoords[1]);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // Run once on mount

  // Sincronizar coordenadas iniciales si se cargan asíncronamente
  useEffect(() => {
    if (
      initialCoordinates &&
      initialCoordinates[0] &&
      initialCoordinates[1] &&
      (Math.abs(initialCoordinates[0] - coords[0]) > 0.0001 ||
        Math.abs(initialCoordinates[1] - coords[1]) > 0.0001)
    ) {
      setCoords(initialCoordinates);
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView(initialCoordinates, 16);
        markerRef.current.setLatLng(initialCoordinates);
        mapInstanceRef.current.invalidateSize();
      }
    }
  }, [initialCoordinates]);

  // Sincronizar dirección inicial si se carga asíncronamente
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  // Sincronizar cuando cambia selectedCity desde el select externo
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    // Solo reaccionar si la ciudad realmente cambió respecto al valor previo
    if (prevCityRef.current === selectedCity) {
      return;
    }
    prevCityRef.current = selectedCity;

    // Si el cambio de ciudad provino de un pin/GPS interno, consumir la bandera y no re-volar al centro
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const newCoords = getCoordsForCity(selectedCity);
    mapInstanceRef.current.flyTo(newCoords, 14, { duration: 1.2 });
    markerRef.current.setLatLng(newCoords);
    setCoords(newCoords);
    handleReverseGeocode(newCoords[0], newCoords[1]);
  }, [selectedCity, handleReverseGeocode]);

  // Manejo de búsqueda hacia adelante (OpenStreetMap Nominatim Search)
  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (text.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const queryWithContext = `${text}, Sureste México`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryWithContext
          )}&limit=5&countrycodes=mx&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "es",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed = data.map((item: any) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            road: item.address?.road || "",
            suburb:
              item.address?.suburb ||
              item.address?.neighbourhood ||
              item.address?.residential ||
              "",
          }));
          setSearchResults(parsed);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.warn("Search geocode error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSearchResult = (item: {
    displayName: string;
    lat: number;
    lon: number;
  }) => {
    setShowSearchResults(false);
    setSearchQuery("");
    const newCoords: [number, number] = [item.lat, item.lon];
    setCoords(newCoords);
    isInternalUpdateRef.current = true;

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo(newCoords, 16, { duration: 1.2 });
      markerRef.current.setLatLng(newCoords);
      handleReverseGeocode(item.lat, item.lon);
    }
  };

  // Detección automática por GPS precisa (maximumAge: 0, enableHighAccuracy: true)
  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocalización no soportada", {
        description: "Tu navegador no permite la detección de ubicación.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const newCoords: [number, number] = [latitude, longitude];
        setCoords(newCoords);
        isInternalUpdateRef.current = true;

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo(newCoords, 16, { duration: 1.2 });
          markerRef.current.setLatLng(newCoords);
          handleReverseGeocode(latitude, longitude);
          toast.success("Ubicación detectada por GPS", {
            description: "El pin se colocó en tu ubicación actual.",
          });
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permiso de GPS denegado", {
            description:
              "Permite el acceso a ubicación o haz clic en el mapa.",
          });
        } else {
          toast.error("No se pudo obtener tu ubicación GPS", {
            description: "Puedes hacer clic en cualquier punto del mapa para colocar el pin.",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Callback de confirmación desde el modal
  const handleModalConfirm = (result: LocationResult) => {
    isInternalUpdateRef.current = true;
    const newCoords: [number, number] = [result.latitude, result.longitude];
    setCoords(newCoords);
    setAddress(result.address);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo(newCoords, 16, { duration: 0.8 });
      markerRef.current.setLatLng(newCoords);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    onLocationChange(result);
  };

  return (
    <div className={cn("w-full flex flex-col gap-2.5", className)}>
      {/* Global CSS override for Leaflet div icon transparent styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .kanpro-map-pin-marker {
              background: transparent !important;
              border: none !important;
            }
            .leaflet-container {
              width: 100% !important;
              height: 100% !important;
            }
          `,
        }}
      />

      {/* ── Barra de Búsqueda Geocodificada, Botón GPS y Botón Ampliar ── */}
      <div className="relative w-full flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {isSearching ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Search className="size-3.5" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            placeholder="Buscar calle, colonia o zona..."
            className="w-full h-9.5 pl-8.5 pr-8 rounded-xl bg-card border border-input text-foreground text-xs shadow-2xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none transition-all placeholder:text-muted-foreground/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              <X className="size-3" />
            </button>
          )}

          {/* Menú de Resultados Autocomplete */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              <div className="p-1 space-y-0.5">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted/70 flex items-start gap-2 text-xs transition-colors cursor-pointer"
                  >
                    <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground block truncate">
                        {item.road || item.suburb || "Ubicación"}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.displayName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botón Mi Ubicación Actual (GPS) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDetectGPS}
          disabled={isLocating}
          title="Detectar mi ubicación actual vía GPS"
          className="h-9.5 px-3 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer shrink-0 border-input bg-card hover:bg-accent"
        >
          {isLocating ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : (
            <Navigation className="size-3.5 text-primary" />
          )}
          <span className="hidden sm:inline">GPS</span>
        </Button>

        {/* Botón Ampliar Mapa (Modal Dialog) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          title="Ampliar mapa en pantalla completa"
          className="h-9.5 px-3 rounded-xl gap-1.5 text-xs font-semibold cursor-pointer shrink-0 border-input bg-card hover:bg-accent text-primary"
        >
          <Maximize2 className="size-3.5" />
          <span className="hidden sm:inline">Ampliar</span>
        </Button>
      </div>

      {/* ── Contenedor del Mapa Leaflet + OpenStreetMap ── */}
      <div className="relative w-full h-52 sm:h-56 rounded-2xl border border-border/70 overflow-hidden shadow-xs bg-muted/20">
        <div ref={mapContainerRef} className="size-full z-0 cursor-crosshair" />

        {/* Botón de acceso rápido para ampliar en la esquina superior derecha */}
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          onClick={() => setIsModalOpen(true)}
          title="Ampliar mapa"
          className="absolute top-2.5 right-2.5 z-10 size-8 rounded-lg bg-background/90 backdrop-blur-sm border border-border/70 shadow-xs hover:bg-background text-foreground cursor-pointer"
        >
          <Maximize2 className="size-3.5 text-primary" />
        </Button>

        {/* Indicador de carga de geocodificación */}
        {isGeocoding && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground shadow-xs select-none">
            <Loader2 className="size-3 animate-spin text-primary" />
            <span>Obteniendo dirección...</span>
          </div>
        )}

        {/* Floating chip con instrucción de clic o arrastre */}
        <div className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg px-2 sm:px-2.5 py-1 text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 shadow-2xs pointer-events-none select-none max-w-[85%]">
          <MapPin className="size-3 text-primary shrink-0" />
          <span className="truncate">Toca para fijar el pin o usa &ldquo;Ampliar&rdquo;</span>
        </div>
      </div>

      {/* ── Dossier de Dirección Detectada (Editable por el usuario) ── */}
      <div className="w-full rounded-xl border border-border/60 bg-muted/30 p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
            <Building2 className="size-3.5 text-primary" />
            <span>Dirección Exacta de la Empresa</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/80">
            {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
          </span>
        </div>

        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            onLocationChange({
              address: e.target.value,
              city: selectedCity,
              latitude: coords[0],
              longitude: coords[1],
            });
          }}
          placeholder="Calle, número, colonia o parque industrial..."
          className="w-full h-8 px-2.5 rounded-lg bg-background border border-input text-xs font-medium text-foreground shadow-2xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none placeholder:text-muted-foreground/60 transition-all"
        />
        <p className="text-[10px] text-muted-foreground leading-tight px-0.5">
          Puedes afinar la dirección agregando número interior, piso o referencia.
        </p>
      </div>

      {/* ── Modal Dialog de Mapa Expandido ── */}
      <ExpandedMapDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        currentCoords={coords}
        currentAddress={address}
        selectedCity={selectedCity}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
