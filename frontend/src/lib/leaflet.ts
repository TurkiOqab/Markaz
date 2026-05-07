// Single source of truth for the Leaflet instance.
// Setting window.L = L here lets the leaflet.heat plugin (loaded by
// `./leafletPlugins.ts`) attach `heatLayer` to the same instance we use.

import L from "leaflet";
// Bundle Leaflet's CSS via npm so the map doesn't depend on a CDN being reachable.
import "leaflet/dist/leaflet.css";

if (typeof window !== "undefined") {
  (window as unknown as { L: typeof L }).L = L;
}

export default L;
