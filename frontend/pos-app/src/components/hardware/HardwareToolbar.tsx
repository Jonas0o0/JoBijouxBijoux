import { useState } from "react";
import {
  Scale,
  CreditCard,
  Printer,
  Shield,
  Smartphone,
  Monitor,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Store,
  ChevronDown,
  Check,
  Lock,
  Building2,
  MapPin,
} from "lucide-react";
import { useHardwareStore } from "../../store/useHardwareStore";
import { useUserStore } from "../../store/useUserStore";
import { Modal, formatCurrency } from "@erp-bijoux/shared-ui";
import { formatWeight } from "@erp-bijoux/shared-ui";

export function HardwareToolbar() {
  const {
    scaleWeight,
    isScaleStable,
    isScaleConnected,
    scaleConnectionMode,
    tareScale,
    setSimulatedWeight,
    tpeStatus,
    openCashDrawer,
    lastPrintedLabel,
  } = useHardwareStore();

  const {
    tenant,
    stores,
    currentStore,
    switchStore,
    logout,
    deviceMode,
    toggleDeviceMode,
    currentSeller,
  } = useUserStore();

  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [manualWeightInput, setManualWeightInput] = useState<string>("12.450");
  const [isStableToggle, setIsStableToggle] = useState<boolean>(true);
  const [isZplPreviewOpen, setIsZplPreviewOpen] = useState(false);

  const handleApplySimulatedWeight = () => {
    const val = parseFloat(manualWeightInput) || 0;
    setSimulatedWeight(val, isStableToggle);
  };

  return (
    <>
      <header className="bg-white/95 border-b border-slate-200/90 text-slate-800 px-4 py-2 flex items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        {/* Brand & Store Selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-serif text-slate-950 font-bold text-lg shadow-sm shrink-0">
            {tenant?.logoIcon || "💎"}
          </div>

          {/* Interactive Multi-Store Dropdown Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
              className="flex items-center gap-2 p-1.5 -m-1.5 rounded-xl hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors text-left group"
              title="Cliquer pour changer de boutique ou point de vente"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-amber-800 transition-colors">
                    {currentStore?.name || "Boutique Principale"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-mono font-medium border border-amber-200">
                    {currentStore?.posNumber || "CAISSE-01"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-transform duration-200 ${
                      isStoreMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                    {tenant?.code || "VENDOME"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-800 font-medium truncate max-w-[140px]">
                    {currentSeller.name}
                  </span>
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isStoreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsStoreMenuOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{tenant?.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bascule rapide de boutique active
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-bold">
                      {stores.length} sites
                    </span>
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {stores.map((store) => {
                      const isActive = store.id === currentStore?.id;
                      return (
                        <button
                          key={store.id}
                          onClick={() => {
                            switchStore(store.id);
                            setIsStoreMenuOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between text-xs ${
                            isActive
                              ? "bg-amber-500/10 border border-amber-500/40 text-amber-950 font-semibold"
                              : "hover:bg-slate-50 border border-transparent text-slate-700"
                          }`}
                        >
                          <div className="space-y-0.5 overflow-hidden pr-2">
                            <div className="flex items-center gap-1.5">
                              <Store className={`w-3.5 h-3.5 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                              <span className="font-bold truncate text-slate-900">
                                {store.name}
                              </span>
                              {store.isFlagship && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold shrink-0">
                                  Flagship
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              <span className="truncate">{store.address}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                              <span>{store.posNumber}</span>
                              <span>•</span>
                              <span>Stock: {store.stockCount} pcs</span>
                              {store.dailyTurnover && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-800 font-medium">
                                    {formatCurrency(store.dailyTurnover)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <div className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Hardware Indicators & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
          {/* Connected Scale Widget */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 shadow-2xs ${
              isScaleConnected
                ? "bg-slate-50 border-slate-200/90"
                : "bg-slate-50/50 border-slate-200 text-slate-400"
            }`}
          >
            <Scale className={`w-4 h-4 ${isScaleConnected ? "text-amber-600" : "text-slate-400"}`} />

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                {formatWeight(scaleWeight)}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-sans font-bold tracking-wide uppercase ${
                  isScaleStable
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                }`}
                title={isScaleStable ? "Poids stabilisé métrologie légale" : "Mesure en cours (instable)"}
              >
                {isScaleStable ? "STABLE" : "DYN"}
              </span>
            </div>

            <button
              onClick={() => tareScale()}
              title="Tarer la balance (F8)"
              className="px-2 py-0.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 font-sans text-[11px] font-medium transition-colors shadow-2xs"
            >
              Tare (F8)
            </button>
          </div>

          {/* TPE Terminal status */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shadow-2xs ${
              tpeStatus === "PROCESSING" || tpeStatus === "WAITING_INSERTION"
                ? "bg-amber-50 border-amber-300 text-amber-900 animate-pulse"
                : tpeStatus === "APPROVED"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium text-slate-500">TPE:</span>
            <span className="font-mono text-[11px] font-bold">
              {tpeStatus === "IDLE" ? "Prêt" : tpeStatus}
            </span>
          </div>

          {/* Zebra Printer Status & Preview */}
          <button
            onClick={() => setIsZplPreviewOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 transition-colors shadow-2xs"
            title="Dernière étiquette ZPL bijou imprimée"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Zebra ZPL</span>
          </button>

          {/* Cash drawer button */}
          <button
            onClick={openCashDrawer}
            title="Ouvrir le tiroir-caisse (F9)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 transition-colors shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline font-medium">Tiroir (F9)</span>
          </button>

          {/* Hardware simulator dialog button */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            title="Simulateur Matériel (Balance, TPE, ZPL)"
            className="p-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors shadow-2xs"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Dual-device switcher: PC Caisse vs Smartphone Vendeuse */}
          <button
            onClick={toggleDeviceMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-xs transition-all shadow-2xs ${
              deviceMode === "MOBILE_VENDEUSE"
                ? "bg-purple-600 text-white shadow-purple-900/30"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
            }`}
            title="Basculer entre le mode PC de Caisse Tactile et le mode Smartphone Vendeuse Nomade"
          >
            {deviceMode === "MOBILE_VENDEUSE" ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-purple-200" />
                <span>Mode Vendeuse</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-amber-600" />
                <span>Mode PC Caisse</span>
              </>
            )}
          </button>

          {/* Lock / Logout Session Button */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs transition-colors shadow-2xs"
            title="Verrouiller la caisse / Déconnexion session"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span className="hidden sm:inline font-medium">Verrouiller</span>
          </button>
        </div>
      </header>

      {/* Hardware Mock Simulator Dialog */}
      <Modal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        title={
          <span className="flex items-center gap-2 text-slate-900">
            <Sliders className="w-5 h-5 text-amber-600" />
            <span>Passerelle Matérielle & Simulateur Joaillerie</span>
          </span>
        }
        description="Contrôlez les périphériques physiques connectés (Port 8089 WebSocket / HTTP & 9100 RAW ZPL)"
      >
        <div className="space-y-6">
          {/* Scale Controller */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                Balance de précision (Mettler Toledo / Ohaus SICS)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-white text-slate-600 font-mono border border-slate-200 shadow-2xs">
                {scaleConnectionMode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Poids en grammes</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={manualWeightInput}
                    onChange={(e) => setManualWeightInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <span className="text-sm font-mono text-slate-500">g</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Stabilité métrologique</label>
                <button
                  type="button"
                  onClick={() => setIsStableToggle(!isStableToggle)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border shadow-2xs transition-colors ${
                    isStableToggle
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-amber-50 border-amber-300 text-amber-800"
                  }`}
                >
                  {isStableToggle ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Stable (Pesée certifiée)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Dynamique / Instable
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleApplySimulatedWeight}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-2xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Appliquer poids sur la balance
              </button>
              <button
                onClick={() => {
                  setManualWeightInput("0.000");
                  tareScale();
                }}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs transition-colors"
              >
                Tarer à 0.000 g
              </button>
            </div>
          </div>

          {/* TPE Terminal Controller */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Terminal de Paiement Bancaire (Ingenico / PAX / CB 5.5)
            </span>
            <p className="text-xs text-slate-500">
              Le protocole TPE déclenche automatiquement la demande lors du règlement en CB sur le terminal de caisse.
            </p>
          </div>
        </div>
      </Modal>

      {/* Zebra ZPL Label Preview Modal */}
      <Modal
        isOpen={isZplPreviewOpen}
        onClose={() => setIsZplPreviewOpen(false)}
        title="Prévisualisation Étiquette Bijou Zebra (ZPL II)"
        description="Format haltère bijouterie 38x13mm avec code-barres 128"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 text-slate-950 p-6 rounded-xl border border-slate-200 flex items-center justify-center">
            {/* SVG preview of rat-tail label */}
            <div className="border border-dashed border-slate-300 p-4 rounded-xl bg-white w-full max-w-sm shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-1">
                <span>{lastPrintedLabel?.reference || "SOL-DIAM-050-YG"}</span>
                <span className="font-mono text-amber-700">2 890,00 €</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Solitaire Or Jaune 18K - 3.42g
              </div>
              <div className="mt-2 flex items-center justify-center py-1 bg-slate-50 border border-slate-200 rounded">
                <div className="font-mono text-center">
                  <div className="tracking-widest text-xs font-bold text-slate-800">||| | |||| | ||| || |||</div>
                  <div className="text-[9px] text-slate-500">200000000101</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1 font-semibold">Code source ZPL envoyé à l'imprimante :</label>
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 max-h-40">
              {lastPrintedLabel?.zpl || `^XA
^PW304^LL104
^FO20,15^A0N,18,18^FDSolitaire Or Jaune 18K^FS
^FO20,38^A0N,16,16^FDRef: SOL-DIAM-050-YG^FS
^FO20,58^BY1,2,24^BCN,24,N,N,N^FD200000000101^FS
^FO180,38^A0N,22,22^FD2890.00 EUR^FS
^FO180,68^A0N,16,16^FDOr 18K^FS
^XZ`}
            </pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
