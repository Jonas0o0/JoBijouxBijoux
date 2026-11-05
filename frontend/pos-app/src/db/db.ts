import Dexie, { type EntityTable } from "dexie";

export interface ProductItem {
  id: string;
  reference: string;
  barcode: string;
  name: string;
  category: "bague" | "collier" | "bracelet" | "boucles" | "montre" | "service" | "matiere";
  metalType?: "or_jaune" | "or_blanc" | "or_rose" | "platine" | "argent" | "acier";
  goldCarats?: "24k" | "18k" | "14k" | "9k";
  weightGrams?: number;
  fingerSize?: number; // Tour de doigt
  diamond4C?: {
    carat: number;
    color: string;
    clarity: string;
    cut: string;
  };
  priceTTC: number;
  vatRate: number; // e.g. 0.20 or 0.055
  stockVitrine: number;
  stockCoffre: number;
  isQuickService?: boolean;
  imageUrl?: string;
}

export interface SalePayment {
  method: "CB_TPE" | "ESPECES" | "AVOIR" | "VIREMENT" | "CHEQUE";
  amount: number;
  reference?: string;
  authorizationCode?: string;
  timestamp: string;
}

export interface SaleItem {
  productId: string;
  reference: string;
  name: string;
  unitPriceTTC: number;
  quantity: number;
  discountPercent: number;
  vatRate: number;
  totalTTC: number;
  customNotes?: string;
  serialNumber?: string;
}

export interface SaleRecord {
  id: string;
  ticketNumber: string;
  sellerId: string;
  sellerName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotalHT: number;
  totalVAT: number;
  totalTTC: number;
  vatBreakdown: { [rate: string]: { baseHT: number; vatAmount: number } };
  payments: SalePayment[];
  changeGiven: number;
  createdAt: string;
  status: "COMPLETED" | "CANCELLED" | "REFUNDED";
  fiscalHash: string; // Chained SHA256 simulation NF525
  synchronized: boolean;
}

export interface GoldBuybackRecord {
  id: string;
  contractNumber: string;
  sellerId: string;
  sellerName: string;
  client: {
    fullName: string;
    idType: "CNI" | "PASSEPORT" | "TITRE_SEJOUR";
    idNumber: string;
    idScanUrl?: string;
    address: string;
    birthDate: string;
    phone: string;
    iban?: string;
  };
  items: Array<{
    description: string;
    goldFineness: "24k" | "18k" | "14k" | "9k" | "argent_925";
    finenessThousandths: number; // e.g. 750
    grossWeightGrams: number;
    netWeightGrams: number;
    goldPricePerGram: number;
    grossAmount: number;
  }>;
  totalGrossAmount: number;
  tmpTaxRate: number; // 0.115 (11% TMP + 0.5% CRDS)
  tmpTaxAmount: number;
  netPayoutAmount: number;
  paymentMethod: "VIREMENT" | "CHEQUE"; // Stricly NO cash by French Law
  paymentReference: string;
  coolingOffPeriodEndsAt: string; // 48h legal notice
  policeBookEntryId: string;
  createdAt: string;
}

export interface RepairItem {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  jewelryType: "bague" | "collier" | "bracelet" | "montre" | "boucles";
  brandOrMetal: string;
  description: string;
  repairDetails: string;
  inspectionAnnotations: Array<{
    x: number;
    y: number;
    type: "rayure" | "choc" | "manque_pierre" | "griffe_usee" | "autre";
    note: string;
  }>;
  status: "DEPOSE" | "DIAGNOSTIC" | "DEVIS_EN_ATTENTE" | "EN_COURS" | "TERMINE_AU_COFFRE" | "LIVRE";
  estimatedCost: number;
  depositPaid: number;
  promisedDate: string;
  createdAt: string;
}

export interface PoliceBookEntry {
  id: string;
  orderNumber: number; // N° d'ordre séquentiel inaltérable
  date: string;
  movementType: "ACHAT" | "VENTE" | "DEPOT_REPARATION" | "RACHAT_OR";
  natureOfGoods: string;
  metalAndFineness: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  individualNumberOrHallmark?: string;
  partyName: string; // Nom du client ou fournisseur
  partyAddress: string;
  partyIdDocument?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  paymentMethod: string;
  invoiceOrContractRef: string;
  createdAt: string;
  sealedHash: string;
}

class ERPBijouxDatabase extends Dexie {
  products!: EntityTable<ProductItem, "id">;
  sales!: EntityTable<SaleRecord, "id">;
  goldBuybacks!: EntityTable<GoldBuybackRecord, "id">;
  repairs!: EntityTable<RepairItem, "id">;
  policeBook!: EntityTable<PoliceBookEntry, "id">;

  constructor() {
    super("ERPBijouxPOSDB");
    this.version(1).stores({
      products: "id, reference, barcode, category, isQuickService",
      sales: "id, ticketNumber, createdAt, customerId, status, synchronized",
      goldBuybacks: "id, contractNumber, createdAt",
      repairs: "id, ticketNumber, customerId, status, promisedDate",
      policeBook: "id, ++orderNumber, date, movementType, invoiceOrContractRef",
    });
  }
}

export const db = new ERPBijouxDatabase();
