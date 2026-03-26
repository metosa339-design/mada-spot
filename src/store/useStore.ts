import { create } from 'zustand';

interface AppState {
  isMenuOpen: boolean;
  viewMode: 'grid' | 'list' | 'timeline';

  toggleMenu: () => void;
  setViewMode: (mode: 'grid' | 'list' | 'timeline') => void;
}

export const useStore = create<AppState>((set) => ({
  isMenuOpen: false,
  viewMode: 'grid',

  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
