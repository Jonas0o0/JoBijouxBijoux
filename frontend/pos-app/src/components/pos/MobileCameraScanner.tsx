import { useEffect, useRef, useState } from "react";
import { Camera, X, Zap, Barcode } from "lucide-react";
import { Modal } from "@erp-bijoux/shared-ui";

interface MobileCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function MobileCameraScanner({
  isOpen,
  onClose,
  onScan,
}: MobileCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let barcodeDetector: any = null;
    let detectionInterval: number | null = null;

    if (isOpen) {
      if ("BarcodeDetector" in window) {
        try {
          barcodeDetector = new (window as any).BarcodeDetector({
            formats: ["code_128", "ean_13", "qr_code", "data_matrix"],
          });
        } catch {
          // fallback
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

          // Polling frame for BarcodeDetector
          if (barcodeDetector) {
            detectionInterval = window.setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    if (rawValue) {
                      triggerDetectedBarcode(rawValue);
                    }
                  }
                } catch {
                  // ignore frame error
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
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const triggerDetectedBarcode = (code: string) => {
    setLastScannedCode(code);
    // Beep sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // audio disabled
    }

    onScan(code);
    setTimeout(() => {
      onClose();
    }, 400);
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
          // torch not supported
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
        <span className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-400" />
          <span>Scanner Caméra Vendeuse</span>
        </span>
      }
      description="Pointez la caméra vers l'étiquette bijou (code-barres 128 / QR)"
    >
      <div className="space-y-4">
        {/* Video feed or simulated viewport */}
        <div className="relative aspect-[3/4] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Targeting reticle / viewfinder */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="relative w-64 h-48 border-2 border-amber-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
              {/* Animated scanline */}
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce top-1/2" />
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-400" />
            </div>
          </div>

          {/* Torch & Close buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                torchOn ? "bg-amber-400 text-slate-950" : "bg-slate-900/80 text-white hover:bg-slate-800"
              }`}
              title="Lampe torche"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {lastScannedCode && (
            <div className="absolute bottom-4 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
              Code détecté : {lastScannedCode}
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
              <Camera className="w-10 h-10 text-amber-500" />
              <p className="text-sm font-semibold">Caméra non disponible ou accès refusé</p>
              <p className="text-xs text-slate-400">
                Vous pouvez utiliser les boutons d'essai rapide ci-dessous pour simuler un scan instantané.
              </p>
            </div>
          )}
        </div>

        {/* Quick simulation buttons for testing instant scan on any device */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulation de scan rapide pour test (sans appareil photo) :</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => triggerDetectedBarcode("200000000101")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs"
            >
              <span className="font-semibold text-slate-100 block truncate">Solitaire 18K</span>
              <span className="text-[10px] text-amber-400 font-mono">200000000101</span>
            </button>
            <button
              type="button"
              onClick={() => triggerDetectedBarcode("200000000102")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs"
            >
              <span className="font-semibold text-slate-100 block truncate">Alliance Platine</span>
              <span className="text-[10px] text-amber-400 font-mono">200000000102</span>
            </button>
            <button
              type="button"
              onClick={() => triggerDetectedBarcode("200000000104")}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-left text-xs"
            >
              <span className="font-semibold text-slate-100 block truncate">Rivière Diamants</span>
              <span className="text-[10px] text-amber-400 font-mono">200000000104</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
