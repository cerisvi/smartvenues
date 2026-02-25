const STORAGE_KEY = 'smartvenues_requests';

export interface AvailabilityRequest {
  id: string;
  venueId: string | number;
  venueName: string;
  dateFrom: string;
  dateTo: string;
  timeSlots: string[];
  people: string;
  seats: string;
  specialNeeds: string[];
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  submittedAt: string; // ISO string
}

export function saveRequest(req: Omit<AvailabilityRequest, 'id' | 'submittedAt'>): AvailabilityRequest {
  const requests = loadRequests();
  const newReq: AvailabilityRequest = {
    ...req,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
  };
  requests.unshift(newReq);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return newReq;
}

export function loadRequests(): AvailabilityRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AvailabilityRequest[]) : [];
  } catch {
    return [];
  }
}

export function deleteRequest(id: string): void {
  const requests = loadRequests().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}
