import { create } from 'zustand';
import type { Language } from './i18n';

export interface Product {
  id: string;
  brand: string;
  brand_id: string | null;
  model: string;
  category: string;
  watts: number;
  lumens: number;
  efficiency: number;
  cct: number;
  cri: number;
  lifespan: number;
  warranty: number;
  cert_ul: boolean;
  cert_dlc: boolean;
  cert_energy_star: boolean;
  price: number;
  currency: string;
  region_id: string;
  state_province: string | null;
  sales_channel: string;
  use_type: string;
  is_recommended: boolean;
  sku: string | null;
  product_url: string | null;
  spec_hash: string | null;
  ip_rating: string | null;
  dimming: string | null;
  voltage: string | null;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
  regions?: { name: string; abbreviation: string; country: string } | null;
}

export interface Region {
  id: string;
  name: string;
  country: string;
  abbreviation: string;
}

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  selectedRegion: string | null;
  setSelectedRegion: (regionId: string | null) => void;
  compareList: string[];
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
  selectedRegion: null,
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
  compareList: [],
  addToCompare: (productId) =>
    set((state) => {
      if (state.compareList.length >= 3 || state.compareList.includes(productId)) return state;
      return { compareList: [...state.compareList, productId] };
    }),
  removeFromCompare: (productId) =>
    set((state) => ({ compareList: state.compareList.filter((id) => id !== productId) })),
  clearCompare: () => set({ compareList: [] }),
}));
