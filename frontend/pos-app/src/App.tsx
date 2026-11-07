import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Package,
  Users,
  Scale,
  Wrench,
  BookOpen,
  ArrowRight,
  Truck,
  BarChart3,
  Building2,
} from "lucide-react";
import { initDatabaseSeed } from "./db/seed";
import { useHardwareStore } from "./store/useHardwareStore";
import { useUserStore } from "./store/useUserStore";
import { usePosStore } from "./store/usePosStore";
import { HardwareToolbar } from "./components/hardware/HardwareToolbar";
import { PosScreen } from "./components/pos/PosScreen";
import { StockInventoryScreen } from "./components/stock/StockInventoryScreen";
import { CustomerCrmScreen } from "./components/crm/CustomerCrmScreen";
import { GoldBuybackScreen } from "./components/gold/GoldBuybackScreen";
import { WorkshopScreen } from "./components/workshop/WorkshopScreen";
import { PoliceBookScreen } from "./components/police/PoliceBookScreen";
import { SupplierOrdersScreen } from "./components/orders/SupplierOrdersScreen";
import { AccountingScreen } from "./components/accounting/AccountingScreen";
import { MultiStoreScreen } from "./components/stores/MultiStoreScreen";
import { LoginScreen } from "./components/auth/LoginScreen";
import { formatCurrency } from "@erp-bijoux/shared-ui";

export type ActiveScreen =
  | "POS"
  | "STOCK"
  | "ORDERS"
  | "WORKSHOP"
  | "GOLD"
  | "CRM"
  | "POLICE"
  | "ACCOUNTING"
  | "STORES";

export function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("POS");
  const [isDbReady, setIsDbReady] = useState(false);

  const { connectScale } = useHardwareStore();
  const { currentSeller, storeInfo, isAuthenticated, tenant, isAdmin, isGerant, isVendeur } = useUserStore();
  const { cart, getTotalTTC, customer } = usePosStore();

  const adminMode = isAdmin();
  const gerantMode = isGerant();
  const vendeurMode = isVendeur();

  // Enforce streamlined view for salesperson: redirect to POS if in restricted module
  useEffect(() => {
    if (vendeurMode) {
      const restrictedScreens: ActiveScreen[] = ["ORDERS", "POLICE", "ACCOUNTING", "STORES"];
      if (restrictedScreens.includes(activeScreen)) {
        setActiveScreen("POS");
      }
    }
  }, [vendeurMode, activeScreen]);

  // Initialize Dexie Seed & Connect Hardware scale stream
  useEffect(() => {
    initDatabaseSeed()
      .then(() => {
        setIsDbReady(true);
      })
      .catch((err) => {
        console.warn("Dexie seed error, continuing:", err);
        setIsDbReady(true);
      });

    const cleanupScale = connectScale();
    return () => {
      cleanupScale();
    };
  }, [connectScale]);

  // Global keyboard shortcut to quickly jump to POS screen on F12 if cart active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" && activeScreen !== "POS") {
        e.preventDefault();
        setActiveScreen("POS");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScreen]);

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg animate-bounce">
          💎
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tracking-tight text-slate-900">
            Initialisation de l'ERP Joaillerie & Base Locale Dexie...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {tenant?.name || "Maison Vendôme Haute Joaillerie"}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated: render the luxury SaaS LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const totalCartTTC = getTotalTTC();

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Hardware Toolbar (Scale, TPE, Drawer, Device Switcher, Store Switcher, Lock) */}
      <HardwareToolbar />

      {/* Navigation Tabs for All Business Modules */}
      <nav className="bg-white border-b border-slate-200/90 px-4 py-1.5 flex items-center justify-between text-xs z-20 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1.5">
          {/* 1. Caisse (POS) */}
          <button
            onClick={() => setActiveScreen("POS")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "POS"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <ShoppingBag className={`w-4 h-4 ${activeScreen === "POS" ? "text-amber-200" : "text-amber-600"}`} />
            <span>Caisse (POS)</span>
            {cart.length > 0 && activeScreen !== "POS" && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          {/* 2. Stock & Catalogue */}
          <button
            onClick={() => setActiveScreen("STOCK")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "STOCK"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Package className={`w-4 h-4 ${activeScreen === "STOCK" ? "text-amber-200" : "text-slate-500"}`} />
            <span>Stock & Catalogue</span>
          </button>

          {/* 3. Commandes & Réassort (Gérants & Direction) */}
          {(gerantMode || adminMode) && (
            <button
              onClick={() => setActiveScreen("ORDERS")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeScreen === "ORDERS"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Truck className={`w-4 h-4 ${activeScreen === "ORDERS" ? "text-amber-200" : "text-amber-600"}`} />
              <span>Commandes</span>
            </button>
          )}

          {/* 4. Atelier & SAV */}
          <button
            onClick={() => setActiveScreen("WORKSHOP")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "WORKSHOP"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Wrench className={`w-4 h-4 ${activeScreen === "WORKSHOP" ? "text-amber-200" : "text-slate-500"}`} />
            <span>Atelier & SAV</span>
          </button>

          {/* 5. Rachat d'Or */}
          <button
            onClick={() => setActiveScreen("GOLD")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "GOLD"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Scale className={`w-4 h-4 ${activeScreen === "GOLD" ? "text-amber-200" : "text-amber-600"}`} />
            <span>Rachat d'Or</span>
          </button>

          {/* 6. Clients & Baguier */}
          <button
            onClick={() => setActiveScreen("CRM")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "CRM"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Users className={`w-4 h-4 ${activeScreen === "CRM" ? "text-amber-200" : "text-slate-500"}`} />
            <span>Clients & Baguier</span>
          </button>

          {/* 7. Livre de Police (Gérants & Direction) */}
          {(gerantMode || adminMode) && (
            <button
              onClick={() => setActiveScreen("POLICE")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeScreen === "POLICE"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeScreen === "POLICE" ? "text-amber-200" : "text-slate-500"}`} />
              <span>Livre de Police</span>
            </button>
          )}

          {/* 8. Comptabilité & Clôtures (Gérants & Direction) */}
          {(gerantMode || adminMode) && (
            <button
              onClick={() => setActiveScreen("ACCOUNTING")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeScreen === "ACCOUNTING"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeScreen === "ACCOUNTING" ? "text-amber-200" : "text-slate-500"}`} />
              <span>Comptabilité & Clôtures</span>
            </button>
          )}

          {/* 9. Réseau Magasins & Équipe (Gérants & Direction) */}
          {(gerantMode || adminMode) && (
            <button
              onClick={() => setActiveScreen("STORES")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeScreen === "STORES"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Building2 className={`w-4 h-4 ${activeScreen === "STORES" ? "text-amber-200" : "text-amber-600"}`} />
              <span>{adminMode ? "🏛️ Réseau Magasins" : "👥 Équipe & Boutique"}</span>
            </button>
          )}
        </div>

        {/* Right Info: Role Badge + Keyboard Cheatsheet */}
        <div className="flex items-center gap-3">
          {adminMode ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] shadow-2xs">
              <span>👑 Direction (Tous Droits)</span>
            </span>
          ) : gerantMode ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[10px] shadow-2xs">
              <span>👔 Gérant ({storeInfo?.name})</span>
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[10px] shadow-2xs">
              <span>💎 Mode Vendeuse (Interface Épurée)</span>
            </span>
          )}
        </div>

        {/* Keyboard Shortcut Cheatsheet */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">F1</kbd>{" "}
            Recherche
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">F2</kbd> Client
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">F8</kbd> Tare
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">F9</kbd> Tiroir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">F12</kbd> Caisse
          </span>
        </div>
      </nav>

      {/* Persistent Background Cart Banner (visible when navigating away from POS with items in cart) */}
      {cart.length > 0 && activeScreen !== "POS" && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-2 flex items-center justify-between text-xs shadow-sm z-20 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-lg bg-white/20">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold">Panier Caisse en attente :</span>{" "}
              <span>{cart.length} article(s)</span>
              <span className="mx-2 opacity-60">•</span>
              <span className="font-mono font-black text-amber-100">
                {formatCurrency(totalCartTTC)}
              </span>
              {customer && (
                <span className="ml-3 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
                  Client : {customer.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen("POS")}
              className="px-3.5 py-1 rounded-xl bg-white text-amber-900 font-bold hover:bg-amber-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 text-xs"
            >
              <span>Reprendre la Caisse (F12)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeScreen === "POS" && <PosScreen />}
        {activeScreen === "STOCK" && <StockInventoryScreen onNavigateToPos={() => setActiveScreen("POS")} />}
        {activeScreen === "ORDERS" && <SupplierOrdersScreen onNavigateToStock={() => setActiveScreen("STOCK")} />}
        {activeScreen === "WORKSHOP" && <WorkshopScreen onNavigateToPos={() => setActiveScreen("POS")} />}
        {activeScreen === "GOLD" && <GoldBuybackScreen />}
        {activeScreen === "CRM" && <CustomerCrmScreen onNavigateToPos={() => setActiveScreen("POS")} />}
        {activeScreen === "POLICE" && <PoliceBookScreen />}
        {activeScreen === "ACCOUNTING" && <AccountingScreen />}
        {activeScreen === "STORES" && <MultiStoreScreen onNavigateToPos={() => setActiveScreen("POS")} />}
      </main>

      {/* Bottom Legal / Fiscal Watermark Footer */}
      <footer className="bg-white border-t border-slate-200/90 px-4 py-1.5 text-[10px] text-slate-500 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{tenant?.name || "ERPBijoux Cloud & Edge"}</span>
          <span>•</span>
          <span>Thème Joaillerie Haute Précision</span>
          <span>•</span>
          <span>Norme NF525 & CGI Art. 286 I-3° bis</span>
          <span>•</span>
          <span>Base Dexie IndexedDB active</span>
        </div>
        <div className="font-mono text-slate-600">
          {storeInfo?.name} ({storeInfo?.posNumber}) • {currentSeller?.name}
        </div>
      </footer>
    </div>
  );
}

export default App;
