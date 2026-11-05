import { create } from "zustand";
import { db, type ProductItem, type SaleItem, type SalePayment, type SaleRecord } from "../db/db";

export interface PosState {
  cart: SaleItem[];
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    hasVoucher?: boolean;
    voucherAmount?: number;
  } | null;
  payments: SalePayment[];
  isPaymentModalOpen: boolean;
  lastCompletedSale: SaleRecord | null;
  activeQuickServiceTab: "all" | "bagues" | "colliers" | "bracelets" | "montres" | "services";

  // Actions
  addToCart: (product: ProductItem, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discountPercent: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  clearCart: () => void;

  setCustomer: (customer: PosState["customer"]) => void;
  openPaymentModal: () => void;
  closePaymentModal: () => void;

  addPayment: (payment: Omit<SalePayment, "timestamp">) => boolean;
  removePayment: (index: number) => void;
  clearPayments: () => void;

  finalizeSale: (sellerId: string, sellerName: string) => Promise<SaleRecord | null>;
  resetLastSale: () => void;
  importMobileDraft: (items: SaleItem[], customerName?: string) => void;

  // Selectors
  getSubtotalHT: () => number;
  getTotalVAT: () => number;
  getTotalTTC: () => number;
  getTotalPaid: () => number;
  getRemainingBalance: () => number;
  getChangeDue: () => number;
  getVatBreakdown: () => { [rate: string]: { baseHT: number; vatAmount: number } };
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  customer: null,
  payments: [],
  isPaymentModalOpen: false,
  lastCompletedSale: null,
  activeQuickServiceTab: "all",

  addToCart: (product: ProductItem, quantity = 1) => {
    set((state) => {
      const existingIndex = state.cart.findIndex((i) => i.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...state.cart];
        const item = updated[existingIndex];
        const newQty = item.quantity + quantity;
        const total = (item.unitPriceTTC * (1 - item.discountPercent / 100)) * newQty;
        updated[existingIndex] = { ...item, quantity: newQty, totalTTC: total };
        return { cart: updated };
      }

      const total = product.priceTTC * quantity;
      const newItem: SaleItem = {
        productId: product.id,
        reference: product.reference,
        name: product.name,
        unitPriceTTC: product.priceTTC,
        quantity,
        discountPercent: 0,
        vatRate: product.vatRate,
        totalTTC: total,
      };

      return { cart: [...state.cart, newItem] };
    });
  },

  removeFromCart: (productId: string) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => {
      const updated = state.cart.map((item) => {
        if (item.productId === productId) {
          const total = (item.unitPriceTTC * (1 - item.discountPercent / 100)) * quantity;
          return { ...item, quantity, totalTTC: total };
        }
        return item;
      });
      return { cart: updated };
    });
  },

  updateDiscount: (productId: string, discountPercent: number) => {
    const validDiscount = Math.max(0, Math.min(100, discountPercent));
    set((state) => {
      const updated = state.cart.map((item) => {
        if (item.productId === productId) {
          const total = (item.unitPriceTTC * (1 - validDiscount / 100)) * item.quantity;
          return { ...item, discountPercent: validDiscount, totalTTC: total };
        }
        return item;
      });
      return { cart: updated };
    });
  },

  updateItemNotes: (productId: string, notes: string) => {
    set((state) => {
      const updated = state.cart.map((item) => {
        if (item.productId === productId) {
          return { ...item, customNotes: notes };
        }
        return item;
      });
      return { cart: updated };
    });
  },

  clearCart: () => {
    set({ cart: [], customer: null, payments: [] });
  },

  setCustomer: (customer) => set({ customer }),
  openPaymentModal: () => set({ isPaymentModalOpen: true }),
  closePaymentModal: () => set({ isPaymentModalOpen: false }),

  addPayment: (payment) => {
    const remaining = get().getRemainingBalance();
    if (remaining <= 0 && payment.method !== "ESPECES") {
      return false;
    }

    // French Legal cash check: Max 1000 EUR in cash per commercial transaction
    if (payment.method === "ESPECES") {
      const currentCashTotal = get()
        .payments.filter((p) => p.method === "ESPECES")
        .reduce((sum, p) => sum + p.amount, 0);
      if (currentCashTotal + payment.amount > 1000) {
        alert("Plafond légal espèces dépassé : Le paiement en espèces ne peut excéder 1 000 € (Art. L112-6 CMF).");
        return false;
      }
    }

    const fullPayment: SalePayment = {
      ...payment,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      payments: [...state.payments, fullPayment],
    }));
    return true;
  },

  removePayment: (index) => {
    set((state) => ({
      payments: state.payments.filter((_, i) => i !== index),
    }));
  },

  clearPayments: () => {
    set({ payments: [] });
  },

  getSubtotalHT: () => {
    return get().cart.reduce((sum, item) => {
      const itemHT = item.totalTTC / (1 + item.vatRate);
      return sum + itemHT;
    }, 0);
  },

  getTotalVAT: () => {
    return get().cart.reduce((sum, item) => {
      const itemHT = item.totalTTC / (1 + item.vatRate);
      return sum + (item.totalTTC - itemHT);
    }, 0);
  },

  getTotalTTC: () => {
    return get().cart.reduce((sum, item) => sum + item.totalTTC, 0);
  },

  getTotalPaid: () => {
    return get().payments.reduce((sum, p) => sum + p.amount, 0);
  },

  getRemainingBalance: () => {
    const total = get().getTotalTTC();
    const paid = get().getTotalPaid();
    return Math.max(0, total - paid);
  },

  getChangeDue: () => {
    const total = get().getTotalTTC();
    const paid = get().getTotalPaid();
    return paid > total ? paid - total : 0;
  },

  getVatBreakdown: () => {
    const breakdown: { [rate: string]: { baseHT: number; vatAmount: number } } = {};
    for (const item of get().cart) {
      const rateKey = `${(item.vatRate * 100).toFixed(1)}%`;
      const itemHT = item.totalTTC / (1 + item.vatRate);
      const itemVAT = item.totalTTC - itemHT;
      if (!breakdown[rateKey]) {
        breakdown[rateKey] = { baseHT: 0, vatAmount: 0 };
      }
      breakdown[rateKey].baseHT += itemHT;
      breakdown[rateKey].vatAmount += itemVAT;
    }
    return breakdown;
  },

  finalizeSale: async (sellerId: string, sellerName: string) => {
    const { cart, customer, payments } = get();
    if (cart.length === 0) return null;

    const totalTTC = get().getTotalTTC();
    const subtotalHT = get().getSubtotalHT();
    const totalVAT = get().getTotalVAT();
    const changeGiven = get().getChangeDue();
    const vatBreakdown = get().getVatBreakdown();

    const timestamp = new Date().toISOString();
    const ticketSeq = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TK-${new Date().getFullYear()}-${ticketSeq}`;

    // NF525 chained fiscal signature simulation
    const signaturePayload = `${ticketNumber}|${totalTTC.toFixed(2)}|${sellerId}|${timestamp}`;
    const fiscalHash = btoa(signaturePayload).substring(0, 32);

    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      ticketNumber,
      sellerId,
      sellerName,
      customerId: customer?.id,
      customerName: customer?.name || "Client de passage",
      items: [...cart],
      subtotalHT,
      totalVAT,
      totalTTC,
      vatBreakdown,
      payments: [...payments],
      changeGiven,
      createdAt: timestamp,
      status: "COMPLETED",
      fiscalHash,
      synchronized: false,
    };

    // Save to Dexie
    await db.sales.add(saleRecord);

    // Update stocks in Dexie
    for (const item of cart) {
      const product = await db.products.get(item.productId);
      if (product && !product.isQuickService) {
        const remainingVitrine = Math.max(0, product.stockVitrine - item.quantity);
        await db.products.update(item.productId, { stockVitrine: remainingVitrine });

        // Add to Police Book if precious item
        if (product.metalType || product.goldCarats) {
          const policeEntryCount = await db.policeBook.count();
          await db.policeBook.add({
            id: `pol-${Date.now()}-${item.productId}`,
            orderNumber: 1000 + policeEntryCount + 1,
            date: new Date().toISOString().split("T")[0],
            movementType: "VENTE",
            natureOfGoods: product.name,
            metalAndFineness: product.goldCarats ? `Or ${product.goldCarats} (750‰)` : product.metalType || "Métal précieux",
            grossWeightGrams: product.weightGrams || 0,
            netWeightGrams: product.weightGrams ? product.weightGrams * 0.95 : 0,
            individualNumberOrHallmark: product.reference,
            partyName: customer?.name || "Client Comptoir",
            partyAddress: "Boutique Vendôme",
            sellingPrice: item.totalTTC,
            paymentMethod: payments.map((p) => p.method).join(", "),
            invoiceOrContractRef: ticketNumber,
            createdAt: timestamp,
            sealedHash: fiscalHash,
          });
        }
      }
    }

    set({
      cart: [],
      customer: null,
      payments: [],
      isPaymentModalOpen: false,
      lastCompletedSale: saleRecord,
    });

    return saleRecord;
  },

  resetLastSale: () => set({ lastCompletedSale: null }),

  importMobileDraft: (items: SaleItem[], customerName?: string) => {
    set({
      cart: items,
      customer: customerName ? { name: customerName } : null,
      payments: [],
    });
  },
}));
