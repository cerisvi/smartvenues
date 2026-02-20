import type { VenueCategory } from '../types/venue';

export interface CategoryConfig {
  label: string;
  color: string;
  emoji: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CATEGORY_CONFIG: Record<VenueCategory | 'all', CategoryConfig> = {
  all: {
    label: 'Tutte',
    color: '#6366f1',
    emoji: '🗺️',
    bgClass: 'bg-indigo-500',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-300',
  },
  conference: {
    label: 'Congressi',
    color: '#3b82f6',
    emoji: '🏛️',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
  },
  exhibition: {
    label: 'Fiere',
    color: '#10b981',
    emoji: '🏪',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
  },
  sports: {
    label: 'Sport',
    color: '#f59e0b',
    emoji: '🏟️',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
  },
  entertainment: {
    label: 'Intrattenimento',
    color: '#ec4899',
    emoji: '🎭',
    bgClass: 'bg-pink-500',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-300',
  },
};

export const CATEGORIES: VenueCategory[] = ['conference', 'exhibition', 'sports', 'entertainment'];
