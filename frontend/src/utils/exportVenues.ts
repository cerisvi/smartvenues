import type { VenueFeature } from '../types/venue';

export function exportToCSV(venues: VenueFeature[], filename = 'smartvenues.csv'): void {
  const BOM = '\uFEFF';
  const headers = [
    'ID', 'Nome', 'Categoria', 'Città', 'Regione',
    'Indirizzo', 'Capacità', 'Valutazione',
    'Telefono', 'Email', 'Sito web',
    'Servizi', 'Latitudine', 'Longitudine',
  ];

  const rows = venues.map((v) => {
    const p = v.properties;
    const [lng, lat] = v.geometry.coordinates;
    return [
      p.id, p.name, p.category, p.city, p.region,
      p.address, p.capacity, p.rating,
      p.phone, p.email, p.website,
      p.amenities.join(' | '), lat, lng,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
  });

  const csv = BOM + [headers.map((h) => `"${h}"`), ...rows]
    .map((row) => row.join(','))
    .join('\r\n');

  triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
}

export function exportToGeoJSON(venues: VenueFeature[], filename = 'smartvenues.geojson'): void {
  const collection = {
    type: 'FeatureCollection',
    features: venues,
  };
  const json = JSON.stringify(collection, null, 2);
  triggerDownload(json, filename, 'application/geo+json');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
