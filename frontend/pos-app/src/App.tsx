import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Scale,
  Wrench,
  BookOpen,
} from "lucide-react";
import { initDatabaseSeed } from "./db/seed";
import { useHardwareStore } from "./store/useHardwareStore";
import { useUserStore } from "./store/useUserStore";
import { HardwareToolbar } from "./components/hardware/HardwareToolbar";
import { PosScreen } from "./components/pos/PosScreen";
import { GoldBuybackScreen } from "./components/gold/GoldBuybackScreen";
import { WorkshopScreen } from "./components/workshop/WorkshopScreen";
import { PoliceBookScreen } from "./components/police/PoliceBookScreen";

export type ActiveScreen = "POS" | "GOLD" | "WORKSHOP" | "POLICE";

export function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("POS");
  const [isDbReady, setIsDbReady] = useState(false);

  const { connectScale } = useHardwareStore();
  const { currentSeller, storeInfo } = useUserStore();

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

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold text-2xl animate-spin">
          💎
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Initialisation de la Caisse Joaillerie ERPBijoux & Dexie DB...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Hardware Toolbar (Scale, TPE, Drawer, Device Switcher) */}
      <HardwareToolbar />

      {/* Navigation Tabs for the 4 Business Interfaces */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs z-20 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen("POS")}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "POS"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950/60"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>Caisse Joaillerie (POS)</span>
          </button>

          <button
            onClick={() => setActiveScreen("GOLD")}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "GOLD"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950/60"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Scale className="w-4 h-4 text-amber-300" />
            <span>Rachat d'Or (4 Étapes)</span>
          </button>

          <button
            onClick={() => setActiveScreen("WORKSHOP")}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "WORKSHOP"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950/60"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-300" />
            <span>Atelier & SAV (Schéma SVG)</span>
          </button>

          <button
            onClick={() => setActiveScreen("POLICE")}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeScreen === "POLICE"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950/60"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Livre de Police (Inaltérable)</span>
          </button>
        </div>

        {/* Keyboard Shortcut Cheatsheet for POS operator */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">F1</kbd>{" "}
            Recherche
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">F2</kbd> Client
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">F8</kbd> Tare
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">F9</kbd> Tiroir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">F12</kbd> Encaissement
          </span>
        </div>
      </nav>

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeScreen === "POS" && <PosScreen />}
        {activeScreen === "GOLD" && <GoldBuybackScreen />}
        {activeScreen === "WORKSHOP" && <WorkshopScreen />}
        {activeScreen === "POLICE" && <PoliceBookScreen />}
      </main>

      {/* Bottom Legal / Fiscal Watermark Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 py-1.5 text-[10px] text-slate-500 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ERPBijoux POS • Version 1.0 (Phase 1)</span>
          <span>•</span>
          <span>Norme NF525 & CGI Art. 286 I-3° bis</span>
          <span>•</span>
          <span>Base locale Dexie IndexedDB active</span>
        </div>
        <div className="font-mono text-slate-400">
          {storeInfo.name} ({storeInfo.posNumber}) • {currentSeller.name}
        </div>
      </footer>
    </div>
  );
}

export default App;
