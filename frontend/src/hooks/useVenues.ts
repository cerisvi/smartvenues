import { useState, useEffect } from 'react';
import type { VenueFeature, Filters, Stats } from '../types/venue';
import { fetchAllVenues } from '../lib/venueStorage';

export function useVenues(filters: Filters, refreshKey: number = 0) {
  const [venues, setVenues] = useState<VenueFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAllVenues()
      .then((all) => {
        let filtered = all;

        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter(
            (f) =>
              f.properties.name.toLowerCase().includes(q) ||
              f.properties.city.toLowerCase().includes(q) ||
              f.properties.region.toLowerCase().includes(q),
          );
        }
        if (filters.category) {
          filtered = filtered.filter((f) => f.properties.category === filters.category);
        }
        if (filters.region) {
          filtered = filtered.filter(
            (f) => f.properties.region.toLowerCase() === filters.region.toLowerCase(),
          );
        }
        if (filters.minCapacity > 0) {
          filtered = filtered.filter((f) => f.properties.capacity >= filters.minCapacity);
        }

        setVenues(filtered);
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
    fetchAllVenues().then((venues) => {
      const by_category: Record<string, number> = {};
      for (const f of venues) {
        const cat = f.properties.category;
        by_category[cat] = (by_category[cat] ?? 0) + 1;
      }
      setStats({
        total: venues.length,
        by_category,
        total_capacity: venues.reduce((sum, f) => sum + f.properties.capacity, 0),
      });
    });
  }, []);

  return stats;
}

export function useRegions() {
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    fetchAllVenues().then((venues) => {
      const unique = [...new Set(venues.map((f) => f.properties.region))].sort();
      setRegions(unique);
    });
  }, []);

  return regions;
}
