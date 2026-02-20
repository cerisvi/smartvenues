export type VenueCategory = 'conference' | 'exhibition' | 'sports' | 'entertainment';

export interface VenueProperties {
  id: number;
  name: string;
  category: VenueCategory;
  capacity: number;
  address: string;
  city: string;
  region: string;
  rating: number;
  phone: string;
  email: string;
  website: string;
  amenities: string[];
  image: string;
  description: string;
}

export interface VenueGeometry {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface VenueFeature {
  type: 'Feature';
  geometry: VenueGeometry;
  properties: VenueProperties;
}

export interface VenueFeatureCollection {
  type: 'FeatureCollection';
  features: VenueFeature[];
}

export interface Filters {
  search: string;
  category: string;
  region: string;
  minCapacity: number;
}

export interface Stats {
  total: number;
  by_category: Record<string, number>;
  total_capacity: number;
}
