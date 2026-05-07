// Side-effect import order matters: ./leaflet must execute first so it
// publishes `window.L` before leaflet.heat looks for it.

import "./leaflet";
import "leaflet.heat";

export {};
