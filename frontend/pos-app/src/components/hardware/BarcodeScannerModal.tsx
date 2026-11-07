import { useState, useEffect, useRef } from "react";
import {
  Barcode,
  Camera,
  Keyboard,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Volume2,
} from "lucide-react";
import { db, type ProductItem } from "../../db/db";
import { usePosStore } from "../../store/usePosStore";
import { Modal, formatCurrency } from "@erp-bijoux/shared-ui";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (barcode: string, product: ProductItem | null) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const { addToCart } = usePosStore();

  const [activeTab, setActiveTab] = useState<"USB_DOUCHETTE" | "CAMERA" | "QUICK_TEST">("USB_DOUCHETTE");
  const [manualCode, setManualCode] = useState("");
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    product: ProductItem | null;
  } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  const usbInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play a pleasant high-frequency scanner beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // 1760 Hz (A6 crisp beep)
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio might be restricted
    }
  };

  // Auto-focus USB input when modal opens or tab changes to USB
  useEffect(() => {
    if (isOpen && activeTab === "USB_DOUCHETTE") {
      const timer = setTimeout(() => {
        usbInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  // Handle camera video stream
  useEffect(() => {
    let active = true;
    let barcodeDetector: any = null;
    let detectionInterval: number | null = null;

    if (isOpen && activeTab === "CAMERA") {
      if ("BarcodeDetector" in window) {
        try {
          barcodeDetector = new (window as any).BarcodeDetector({
            formats: ["code_128", "ean_13", "qr_code", "data_matrix"],
          });
        } catch {
          // ignore
        }
      }

      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }

          if (barcodeDetector) {
            detectionInterval = window.setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0 && barcodes[0].rawValue) {
                    handleCodeDetected(barcodes[0].rawValue);
                  }
                } catch {
                  // ignore
                }
              }
            }, 250);
          }
        })
        .catch(() => {
          if (active) setHasCameraPermission(false);
        });
    }

    return () => {
      active = false;
      if (detectionInterval) clearInterval(detectionInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  const handleCodeDetected = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    playBeep();

    // Query Dexie for product
    let product: ProductItem | null = null;
    try {
      product = (await db.products.where("barcode").equals(clean).first()) || null;
      if (!product) {
        // Fallback by reference
        product = (await db.products.where("reference").equals(clean).first()) || null;
      }
    } catch (e) {
      console.warn("Error searching product by barcode:", e);
    }

    setScannedResult({ code: clean, product });

    if (onScanSuccess) {
      onScanSuccess(clean, product);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeDetected(manualCode.trim());
      setManualCode("");
    }
  };

  const handleAddAndClose = (p: ProductItem) => {
    addToCart(p);
    onClose();
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: !torchOn }],
          });
          setTorchOn(!torchOn);
        } catch {
          // torch unsupported
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Barcode className="w-5 h-5 text-amber-600" />
          <span>Scanner de Codes-Barres Joaillerie</span>
        </div>
      }
      description="Scannez les étiquettes haltères bijoux via douchette USB, caméra intégrée ou simulation"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("USB_DOUCHETTE")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "USB_DOUCHETTE"
                ? "bg-white text-slate-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Keyboard className="w-4 h-4 text-amber-600" />
            <span>Douchette USB (Filaire / Sans fil)</span>
          </button>

          <button
            onClick={() => setActiveTab("CAMERA")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "CAMERA"
                ? "bg-white text-slate-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Caméra / Smartphone</span>
          </button>

          <button
            onClick={() => setActiveTab("QUICK_TEST")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "QUICK_TEST"
                ? "bg-white text-slate-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Bips de Démonstration 1-Clic</span>
          </button>
        </div>

        {/* Tab 1: USB Douchette */}
        {activeTab === "USB_DOUCHETTE" && (
          <div className="space-y-4">
            <div className="p-6 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm animate-pulse">
                  <Barcode className="w-8 h-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Lecteur de Code-Barres USB Connecté & Prêt
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Pointez votre douchette optique vers l'étiquette bijou (EAN-13 ou Code 128) et appuyez sur la gâchette. Le scan est immédiat.
                </p>
              </div>

              {/* Form Input for USB scanner / Keyboard Wedge */}
              <form onSubmit={handleManualSubmit} className="w-full max-w-md pt-2">
                <div className="relative">
                  <input
                    ref={usbInputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="En attente du bip douchette (ou saisie manuelle)..."
                    className="w-full pl-9 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner text-center"
                    autoFocus
                  />
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  >
                    Valider
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Caméra Viewport */}
        {activeTab === "CAMERA" && (
          <div className="space-y-3">
            <div className="relative aspect-video sm:aspect-[16/9] bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

              {/* Reticle Viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                <div className="relative w-64 h-36 border-2 border-amber-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex items-center justify-center">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce top-1/2" />
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-400" />
                </div>
              </div>

              {/* Torch button */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                    torchOn ? "bg-amber-400 text-slate-950" : "bg-slate-900/80 text-white hover:bg-slate-800"
                  }`}
                  title="Lampe torche"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>

              {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2">
                  <Camera className="w-10 h-10 text-amber-500" />
                  <p className="text-sm font-semibold">Caméra non accessible</p>
                  <p className="text-xs text-slate-400">
                    Veuillez autoriser l'accès vidéo ou utiliser l'onglet Douchette USB / Bips de démonstration.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Quick Demo Simulation */}
        {activeTab === "QUICK_TEST" && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Cliquez sur l'un des boutons ci-dessous pour déclencher un bip instantané sur une pièce réelle de la bijouterie :
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  code: "200000000101",
                  name: "Solitaire Or Jaune 18K Diamant 0.50ct",
                  price: 2890,
                  tag: "Bague",
                },
                {
                  code: "200000000102",
                  name: "Alliance Platine 950 Demi-Tour Diamants",
                  price: 1450,
                  tag: "Alliance",
                },
                {
                  code: "200000000104",
                  name: "Rivière Diamants Or Blanc 18K (4.20ct)",
                  price: 8900,
                  tag: "Bracelet",
                },
                {
                  code: "200000000105",
                  name: "Bague Émeraude Colombie 1.80ct & Diamants",
                  price: 4200,
                  tag: "Bague",
                },
                {
                  code: "200000000106",
                  name: "Pendentif Saphir Royal Ceylan 2.10ct",
                  price: 3150,
                  tag: "Pendentif",
                },
                {
                  code: "200000000103",
                  name: "Créoles Diamants Or Jaune 18K",
                  price: 1850,
                  tag: "Boucles",
                },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleCodeDetected(item.code)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/40 text-left transition-all group shadow-2xs flex items-center justify-between"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900 group-hover:text-amber-900 transition-colors">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span className="font-bold text-amber-700">{item.code}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-800 rounded-lg text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Bip</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scanned Result Banner */}
        {scannedResult && (
          <div
            className={`p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              scannedResult.product
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-amber-50 border-amber-300 text-amber-950"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    scannedResult.product ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                  }`}
                >
                  {scannedResult.product ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                      {scannedResult.code}
                    </span>
                    <span className="text-xs font-bold">
                      {scannedResult.product ? "Bijou Identifié en Stock" : "Code Inconnu en Stock"}
                    </span>
                  </div>

                  {scannedResult.product ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="font-bold text-sm text-slate-900">
                        {scannedResult.product.name} ({scannedResult.product.reference})
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                        <span className="font-black text-emerald-800 text-sm">
                          {formatCurrency(scannedResult.product.priceTTC)}
                        </span>
                        <span>•</span>
                        <span>Vitrine: {scannedResult.product.stockVitrine} pcs</span>
                        <span>•</span>
                        <span>Coffre: {scannedResult.product.stockCoffre} pcs</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800 mt-1">
                      Aucune pièce joaillerie n'a été trouvée avec ce code-barres. Vous pouvez l'assigner à une pièce existante dans le Studio Étiquettes.
                    </p>
                  )}
                </div>
              </div>

              {scannedResult.product && (
                <button
                  type="button"
                  onClick={() => handleAddAndClose(scannedResult.product!)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter au Panier</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>Signal sonore activé à chaque scan</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
