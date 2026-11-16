import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./location-map-theme.css";

export function addLocationMapTiles(map: L.Map) {
  map.attributionControl.setPrefix(false);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
}

export function createMapPinIcon() {
  return L.divIcon({
    className: "kanpro-map-pin",
    html: '<svg width="36" height="44" viewBox="0 0 36 44" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M18 43C18 43 34 26.5 34 17C34 8.16344 26.8366 1 18 1C9.16344 1 2 8.16344 2 17C2 26.5 18 43 18 43Z" fill="var(--link)" stroke="white" stroke-width="2" stroke-linejoin="round"/><circle cx="18" cy="17" r="6" fill="var(--background)" /></svg>',
    iconSize: [36, 44],
    iconAnchor: [18, 43],
  });
}
