import { create } from "zustand";

export interface UserState {
  currentSeller: {
    id: string;
    name: string;
    initials: string;
    role: string;
  };
  storeInfo: {
    id: string;
    name: string;
    address: string;
    phone: string;
    siret: string;
    tvaIntra: string;
    posNumber: string;
  };
  deviceMode: "DESKTOP_POS" | "MOBILE_VENDEUSE";
  setDeviceMode: (mode: "DESKTOP_POS" | "MOBILE_VENDEUSE") => void;
  toggleDeviceMode: () => void;
  setSeller: (seller: { id: string; name: string; initials: string; role: string }) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentSeller: {
    id: "emp-sophie",
    name: "Sophie Valadier",
    initials: "SV",
    role: "Conseillère Joaillerie",
  },
  storeInfo: {
    id: "store-vendome",
    name: "Maison Vendôme - Haute Joaillerie",
    address: "12 Place Vendôme, 75001 Paris",
    phone: "01 42 68 55 00",
    siret: "482 910 401 00028",
    tvaIntra: "FR 32 482910401",
    posNumber: "CAISSE-01",
  },
  deviceMode: "DESKTOP_POS",
  setDeviceMode: (mode) => set({ deviceMode: mode }),
  toggleDeviceMode: () =>
    set((state) => ({
      deviceMode: state.deviceMode === "DESKTOP_POS" ? "MOBILE_VENDEUSE" : "DESKTOP_POS",
    })),
  setSeller: (seller) => set({ currentSeller: seller }),
}));
