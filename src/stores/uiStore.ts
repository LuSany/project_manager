import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
}

type UIActions = {
  toggleSidebar: () => void;
  setModal: (modal: string | null) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
