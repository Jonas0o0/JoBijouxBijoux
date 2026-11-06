import { create } from "zustand";
import {
  SAAS_TENANTS,
  type TenantInfo,
  type StoreInfo,
  type SellerInfo,
} from "../data/saasData";

export interface UserState {
  isAuthenticated: boolean;
  tenant: {
    id: string;
    name: string;
    code: string;
    plan: string;
    tagline?: string;
    logoIcon?: string;
  };
  stores: StoreInfo[];
  currentStore: StoreInfo;
  storeInfo: StoreInfo; // Alias kept synchronized for backward compatibility
  currentSeller: SellerInfo;
  deviceMode: "DESKTOP_POS" | "MOBILE_VENDEUSE";

  // Actions
  login: (tenantId: string, storeId: string, seller: SellerInfo) => void;
  logout: () => void;
  switchStore: (storeId: string) => void;
  setDeviceMode: (mode: "DESKTOP_POS" | "MOBILE_VENDEUSE") => void;
  toggleDeviceMode: () => void;
  setSeller: (seller: SellerInfo) => void;
}

const STORAGE_KEY = "erp_bijoux_auth_session";

// Helper to load persisted session from localStorage
function getInitialAuthState(): {
  isAuthenticated: boolean;
  tenant: TenantInfo;
  currentStore: StoreInfo;
  currentSeller: SellerInfo;
} {
  const defaultTenant = SAAS_TENANTS[0];
  const defaultStore = defaultTenant.stores[0];
  const defaultSeller = defaultTenant.sellers[0];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const foundTenant = SAAS_TENANTS.find((t) => t.id === parsed.tenantId) || defaultTenant;
      const foundStore = foundTenant.stores.find((s) => s.id === parsed.storeId) || foundTenant.stores[0];
      const foundSeller = foundTenant.sellers.find((s) => s.id === parsed.sellerId) || foundTenant.sellers[0];

      return {
        isAuthenticated: true,
        tenant: foundTenant,
        currentStore: foundStore,
        currentSeller: foundSeller,
      };
    }
  } catch (e) {
    console.warn("Could not read auth from localStorage:", e);
  }

  // Not authenticated by default when starting fresh session
  return {
    isAuthenticated: false,
    tenant: defaultTenant,
    currentStore: defaultStore,
    currentSeller: defaultSeller,
  };
}

const initial = getInitialAuthState();

export const useUserStore = create<UserState>((set, get) => ({
  isAuthenticated: initial.isAuthenticated,
  tenant: {
    id: initial.tenant.id,
    name: initial.tenant.name,
    code: initial.tenant.code,
    plan: initial.tenant.plan,
    tagline: initial.tenant.tagline,
    logoIcon: initial.tenant.logoIcon,
  },
  stores: initial.tenant.stores,
  currentStore: initial.currentStore,
  storeInfo: initial.currentStore,
  currentSeller: initial.currentSeller,
  deviceMode: "DESKTOP_POS",

  login: (tenantId: string, storeId: string, seller: SellerInfo) => {
    const tenant = SAAS_TENANTS.find((t) => t.id === tenantId) || SAAS_TENANTS[0];
    const store = tenant.stores.find((s) => s.id === storeId) || tenant.stores[0];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tenantId: tenant.id,
          storeId: store.id,
          sellerId: seller.id,
        })
      );
    } catch (e) {
      console.warn("Could not save auth session in localStorage:", e);
    }

    set({
      isAuthenticated: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        plan: tenant.plan,
        tagline: tenant.tagline,
        logoIcon: tenant.logoIcon,
      },
      stores: tenant.stores,
      currentStore: store,
      storeInfo: store,
      currentSeller: seller,
    });
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Could not remove auth session:", e);
    }

    set({
      isAuthenticated: false,
    });
  },

  switchStore: (storeId: string) => {
    const { stores, tenant, currentSeller } = get();
    const newStore = stores.find((s) => s.id === storeId);
    if (!newStore) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tenantId: tenant.id,
          storeId: newStore.id,
          sellerId: currentSeller.id,
        })
      );
    } catch (e) {
      console.warn("Could not update store in localStorage:", e);
    }

    set({
      currentStore: newStore,
      storeInfo: newStore,
    });
  },

  setDeviceMode: (mode) => set({ deviceMode: mode }),

  toggleDeviceMode: () =>
    set((state) => ({
      deviceMode: state.deviceMode === "DESKTOP_POS" ? "MOBILE_VENDEUSE" : "DESKTOP_POS",
    })),

  setSeller: (seller) => {
    const { tenant, currentStore } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tenantId: tenant.id,
          storeId: currentStore.id,
          sellerId: seller.id,
        })
      );
    } catch (e) {
      console.warn("Could not update seller in localStorage:", e);
    }
    set({ currentSeller: seller });
  },
}));
