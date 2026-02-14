import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
}

interface UIActions {
  toggleSidebar: () => void;
  setModal: (modal: string | null) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  name: "ui",
  state: {
    sidebarCollapsed: false,
    activeModal: null,
  },
  actions: (set) => ({
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setModal: (modal) => set({ activeModal: modal }),
    closeModal: () => set({ activeModal: null }),
  }),
}));
