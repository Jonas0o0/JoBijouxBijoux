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
  sellers: SellerInfo[];
  deviceMode: "DESKTOP_POS" | "MOBILE_VENDEUSE";

  // Actions
  login: (tenantId: string, storeId: string, seller: SellerInfo) => void;
  logout: () => void;
  switchStore: (storeId: string) => void;
  setDeviceMode: (mode: "DESKTOP_POS" | "MOBILE_VENDEUSE") => void;
  toggleDeviceMode: () => void;
  setSeller: (seller: SellerInfo) => void;
  addSeller: (seller: SellerInfo) => void;
  toggleSellerActive: (sellerId: string) => void;
  updateSellerRole: (
    sellerId: string,
    securityRole: "ROLE_ADMIN" | "ROLE_GERANT" | "ROLE_VENDEUR",
    newRoleLabel?: string
  ) => Promise<void>;
  isAdmin: () => boolean;
  isGerant: () => boolean;
  isVendeur: () => boolean;
}

const STORAGE_KEY = "erp_bijoux_auth_session";
const CUSTOM_SELLERS_KEY = "erp_bijoux_custom_sellers";

function getStoredCustomSellers(): SellerInfo[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SELLERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read custom sellers:", e);
  }
  return [];
}

// Hydrate default tenant with custom sellers on boot
const savedCustomSellers = getStoredCustomSellers();
savedCustomSellers.forEach((custom) => {
  if (!SAAS_TENANTS[0].sellers.find((s) => s.id === custom.id)) {
    SAAS_TENANTS[0].sellers.push(custom);
  }
});

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
  sellers: SAAS_TENANTS[0].sellers,
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

  addSeller: (newSeller: SellerInfo) => {
    // 1. Update in-memory SAAS_TENANTS
    if (!SAAS_TENANTS[0].sellers.find((s) => s.id === newSeller.id)) {
      SAAS_TENANTS[0].sellers.push(newSeller);
    }

    // 2. Persist to localStorage
    const stored = getStoredCustomSellers();
    const updated = [...stored.filter((s) => s.id !== newSeller.id), newSeller];
    try {
      localStorage.setItem(CUSTOM_SELLERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not persist custom seller:", e);
    }

    // 3. Update zustand state
    set((state) => ({
      sellers: [...state.sellers.filter((s) => s.id !== newSeller.id), newSeller],
    }));
  },

  toggleSellerActive: (sellerId: string) => {
    set((state) => {
      const updatedSellers = state.sellers.map((s) =>
        s.id === sellerId ? { ...s, active: s.active === false ? true : false } : s
      );

      // Persist
      try {
        localStorage.setItem(CUSTOM_SELLERS_KEY, JSON.stringify(updatedSellers));
      } catch (e) {
        console.warn("Could not save toggled seller:", e);
      }

      return { sellers: updatedSellers };
    });
  },

  updateSellerRole: async (sellerId, securityRole, newRoleLabel) => {
    // 1. Backend Spring Boot API call (if backend reachable)
    try {
      await fetch(`/api/v1/users/${sellerId}/roles`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": "1",
        },
        body: JSON.stringify({ roles: [securityRole] }),
      });
    } catch (err) {
      console.warn("Backend role update offline:", err);
    }

    // 2. Update state & localStorage
    set((state) => {
      const fallbackTitle =
        securityRole === "ROLE_ADMIN"
          ? "Directeur Général & Administrateur"
          : securityRole === "ROLE_GERANT"
          ? "Directeur de Magasin & Gérant"
          : "Conseillère Joaillerie";

      const updatedSellers = state.sellers.map((s) => {
        if (s.id === sellerId) {
          return {
            ...s,
            securityRole,
            role: newRoleLabel || s.role || fallbackTitle,
          };
        }
        return s;
      });

      try {
        localStorage.setItem(CUSTOM_SELLERS_KEY, JSON.stringify(updatedSellers));
      } catch (e) {
        console.warn("Could not save updated sellers in localStorage:", e);
      }

      let newCurrent = state.currentSeller;
      if (state.currentSeller.id === sellerId) {
        newCurrent = updatedSellers.find((s) => s.id === sellerId) || state.currentSeller;
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              tenantId: state.tenant.id,
              storeId: state.currentStore.id,
              sellerId: newCurrent.id,
            })
          );
        } catch (e) {}
      }

      return {
        sellers: updatedSellers,
        currentSeller: newCurrent,
      };
    });
  },

  isAdmin: () => {
    const { currentSeller } = get();
    if (!currentSeller) return false;
    return (
      currentSeller.securityRole === "ROLE_ADMIN" ||
      currentSeller.role?.toLowerCase().includes("administrateur") ||
      currentSeller.role?.toLowerCase().includes("patron")
    );
  },

  isGerant: () => {
    const { currentSeller } = get();
    if (!currentSeller) return false;
    if (get().isAdmin()) return true;
    return (
      currentSeller.securityRole === "ROLE_GERANT" ||
      currentSeller.role?.toLowerCase().includes("gérant") ||
      currentSeller.role?.toLowerCase().includes("directeur") ||
      currentSeller.role?.toLowerCase().includes("responsable")
    );
  },

  isVendeur: () => {
    return !get().isAdmin() && !get().isGerant();
  },
}));
