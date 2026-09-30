import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'psc-lms-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
