// Module augmentation — the import below makes this a "module file" so that
// the declare module block augments @types/leaflet instead of replacing it.
import type {} from 'leaflet';

declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<string, string>;
  }

  function heatLayer(
    latlngs: Array<[number, number] | [number, number, number]>,
    options?: HeatLayerOptions
  ): Layer;
}

declare module 'leaflet.heat' {
  export {};
}
