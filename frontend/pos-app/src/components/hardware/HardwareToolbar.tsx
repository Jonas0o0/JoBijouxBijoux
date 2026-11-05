import { useState } from "react";
import { Scale, CreditCard, Printer, Shield, Smartphone, Monitor, Sliders, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useHardwareStore } from "../../store/useHardwareStore";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
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

  const { deviceMode, toggleDeviceMode, currentSeller, storeInfo } = useUserStore();

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
      <header className="bg-slate-900/90 border-b border-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-30 shadow-md">
        {/* Brand & Store info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-serif text-slate-950 font-bold text-lg shadow-inner">
            💎
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>Maison Vendôme</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-medium border border-amber-500/20">
                {storeInfo.posNumber}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Caisse certifiée NF525</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400/90">{currentSeller.name}</span>
            </p>
          </div>
        </div>

        {/* Live Hardware Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Connected Scale Widget */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 shadow-sm ${
              isScaleConnected
                ? "bg-slate-950/80 border-slate-700"
                : "bg-slate-950/60 border-slate-800"
            }`}
          >
            <Scale className={`w-4 h-4 ${isScaleConnected ? "text-amber-400" : "text-slate-400"}`} />
            
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-100">
                {formatWeight(scaleWeight)}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold tracking-wide uppercase ${
                  isScaleStable
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                }`}
                title={isScaleStable ? "Poids stabilisé métrologie légale" : "Mesure en cours (instable)"}
              >
                {isScaleStable ? "STABLE" : "DYN"}
              </span>
            </div>

            <button
              onClick={() => tareScale()}
              title="Tarer la balance (F8)"
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded font-sans text-[11px] font-medium transition-colors"
            >
              Tare (F8)
            </button>
          </div>

          {/* TPE Terminal status */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs ${
              tpeStatus === "PROCESSING" || tpeStatus === "WAITING_INSERTION"
                ? "bg-amber-950/50 border-amber-700 text-amber-200 animate-pulse"
                : tpeStatus === "APPROVED"
                ? "bg-emerald-950/50 border-emerald-700 text-emerald-200"
                : "bg-slate-950/60 border-slate-800 text-slate-300"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">TPE:</span>
            <span className="font-mono text-[11px]">
              {tpeStatus === "IDLE" ? "Prêt" : tpeStatus}
            </span>
          </div>

          {/* Zebra Printer Status & Preview */}
          <button
            onClick={() => setIsZplPreviewOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-xs text-slate-300 transition-colors"
            title="Dernière étiquette ZPL bijou imprimée"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Zebra ZPL</span>
          </button>

          {/* Cash drawer button */}
          <button
            onClick={openCashDrawer}
            title="Ouvrir le tiroir-caisse (F9)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Tiroir (F9)</span>
          </button>

          {/* Hardware simulator dialog button */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            title="Simulateur Matériel (Balance, TPE, ZPL)"
            className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Dual-device switcher: PC Caisse vs Smartphone Vendeuse */}
          <button
            onClick={toggleDeviceMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium text-xs transition-all shadow-sm ${
              deviceMode === "MOBILE_VENDEUSE"
                ? "bg-purple-600 text-white shadow-purple-900/50"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
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
                <Monitor className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode PC Caisse</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hardware Mock Simulator Dialog */}
      <Modal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        title={
          <span className="flex items-center gap-2 text-slate-100">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Passerelle Matérielle & Simulateur Joaillerie</span>
          </span>
        }
        description="Contrôlez les périphériques physiques connectés (Port 8089 WebSocket / HTTP & 9100 RAW ZPL)"
      >
        <div className="space-y-6">
          {/* Scale Controller */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                Balance de précision (Mettler Toledo / Ohaus SICS)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {scaleConnectionMode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Poids en grammes</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={manualWeightInput}
                    onChange={(e) => setManualWeightInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-100"
                  />
                  <span className="text-sm font-mono text-slate-400">g</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Stabilité métrologique</label>
                <button
                  type="button"
                  onClick={() => setIsStableToggle(!isStableToggle)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border ${
                    isStableToggle
                      ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                      : "bg-amber-950 border-amber-700 text-amber-300"
                  }`}
                >
                  {isStableToggle ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Stable (Pesée validable)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Dynamique / Instable
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleApplySimulatedWeight}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Appliquer poids sur la balance
              </button>
              <button
                onClick={() => {
                  setManualWeightInput("0.000");
                  tareScale();
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Tarer à 0.000 g
              </button>
            </div>
          </div>

          {/* TPE Terminal Controller */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-400" />
              Terminal de Paiement Bancaire (Ingenico / PAX / CB 5.5)
            </span>
            <p className="text-xs text-slate-400">
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
          <div className="bg-white text-slate-950 p-6 rounded-xl border border-slate-300 shadow-md flex items-center justify-center">
            {/* SVG preview of rat-tail label */}
            <div className="border border-dashed border-slate-400 p-4 rounded bg-amber-50/50 w-full max-w-sm">
              <div className="flex items-center justify-between text-xs font-bold border-b pb-1">
                <span>{lastPrintedLabel?.reference || "SOL-DIAM-050-YG"}</span>
                <span>2 890,00 €</span>
              </div>
              <div className="text-[11px] text-slate-700 mt-1">
                Solitaire Or Jaune 18K - 3.42g
              </div>
              <div className="mt-2 flex items-center justify-center py-1 bg-white border border-slate-200">
                <div className="font-mono text-center">
                  <div className="tracking-widest text-xs font-bold">||| | |||| | ||| || |||</div>
                  <div className="text-[9px] text-slate-500">200000000101</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Code source ZPL envoyé à l'imprimante :</label>
            <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 max-h-40">
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
