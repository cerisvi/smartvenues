import type { VenueFeature, VenueFeatureCollection } from '../types/venue';

const LS_KEY = 'smartvenues_local';

export function loadLocalVenues(): VenueFeature[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVenueLocally(venue: VenueFeature): void {
  const venues = loadLocalVenues();
  venues.push(venue);
  localStorage.setItem(LS_KEY, JSON.stringify(venues));
}

export async function fetchAllVenues(): Promise<VenueFeature[]> {
  const base = import.meta.env.BASE_URL ?? '/';
  const res = await fetch(`${base}venues.json`);
  const data: VenueFeatureCollection = await res.json();
  return [...data.features, ...loadLocalVenues()];
}
