import type { SavedFlightPlan, PlannerForm, PlannerResult } from '../types/drone';
import { CATANIA_HUBS } from '../data/droneData';

const KEY = 'sv_drone_plans_v1';

export function loadPlans(): SavedFlightPlan[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedFlightPlan[];
  } catch {
    return [];
  }
}

function persist(plans: SavedFlightPlan[]): void {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export function savePlan(form: PlannerForm, result: PlannerResult): SavedFlightPlan {
  const origin = CATANIA_HUBS.find((h) => h.id === form.originHubId);
  const dest   = CATANIA_HUBS.find((h) => h.id === form.destinationHubId);
  const now    = new Date();
  const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const plan: SavedFlightPlan = {
    id: crypto.randomUUID(),
    savedAt: now.toISOString(),
    label: `${origin?.shortName ?? '?'}→${dest?.shortName ?? '?'} · ${form.deliveryType} · ${dateStr} ${timeStr}`,
    form,
    result,
  };

  persist([plan, ...loadPlans()]);
  return plan;
}

export function deletePlan(id: string): void {
  persist(loadPlans().filter((p) => p.id !== id));
}

export function clearPlans(): void {
  localStorage.removeItem(KEY);
}
