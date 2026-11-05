import { useEffect } from "react";

interface PosShortcutsHandlers {
  onSearchFocus?: () => void;
  onCustomerOpen?: () => void;
  onScaleTare?: () => void;
  onOpenDrawer?: () => void;
  onCheckout?: () => void;
  onEscape?: () => void;
}

export function usePosShortcuts(handlers: PosShortcutsHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Product search
      if (e.key === "F1") {
        e.preventDefault();
        handlers.onSearchFocus?.();
      }
      // F2: Customer selection
      else if (e.key === "F2") {
        e.preventDefault();
        handlers.onCustomerOpen?.();
      }
      // F8: Balance connectée (tare / weigh)
      else if (e.key === "F8") {
        e.preventDefault();
        handlers.onScaleTare?.();
      }
      // F9: Tiroir-caisse
      else if (e.key === "F9") {
        e.preventDefault();
        handlers.onOpenDrawer?.();
      }
      // F12: Encaissement
      else if (e.key === "F12") {
        e.preventDefault();
        handlers.onCheckout?.();
      }
      // Escape
      else if (e.key === "Escape") {
        handlers.onEscape?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers]);
}
