import { useState, useEffect } from 'react';
import axios from 'axios';
import type { VenueFeature, Filters, Stats } from '../types/venue';

export function useVenues(filters: Filters, refreshKey: number = 0) {
  const [venues, setVenues] = useState<VenueFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.region) params.region = filters.region;
    if (filters.minCapacity > 0) params.min_capacity = filters.minCapacity;

    setLoading(true);
    axios
      .get<{ type: string; features: VenueFeature[] }>('/api/venues', { params })
      .then((res) => {
        setVenues(res.data.features);
        setError(null);
      })
      .catch(() => setError('Errore nel caricamento delle venue'))
      .finally(() => setLoading(false));
  }, [filters.search, filters.category, filters.region, filters.minCapacity, refreshKey]);

  return { venues, loading, error };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    axios.get<Stats>('/api/stats').then((res) => setStats(res.data));
  }, []);
  return stats;
}

export function useRegions() {
  const [regions, setRegions] = useState<string[]>([]);
  useEffect(() => {
    axios.get<{ regions: string[] }>('/api/regions').then((res) => setRegions(res.data.regions));
  }, []);
  return regions;
}
