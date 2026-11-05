import { useEffect, useRef } from "react";

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxKeyInterval?: number; // milliseconds between keystrokes (standard HID scanner is < 35ms)
  minLength?: number;
}

export function useBarcodeScanner({
  onScan,
  maxKeyInterval = 40,
  minLength = 4,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") {
        return;
      }

      const now = performance.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter key marks end of scan
      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        bufferRef.current = "";

        if (barcode.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          onScan(barcode);
        }
        return;
      }

      // If the interval between keys exceeds maxKeyInterval, reset buffer (it was human typing, not scanner)
      if (bufferRef.current.length > 0 && interval > maxKeyInterval) {
        bufferRef.current = "";
      }

      // Only accumulate printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [onScan, maxKeyInterval, minLength]);
}
