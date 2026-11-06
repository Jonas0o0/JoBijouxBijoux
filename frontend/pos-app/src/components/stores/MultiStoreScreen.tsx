import { useState, useEffect } from "react";
import {
  Building2,
  Store,
  Truck,
  ArrowRightLeft,
  CheckCircle2,
  Shield,
  Plus,
  Package,
  MapPin,
  Phone,
  FileText,
  Printer,
  Search,
  Check,
  TrendingUp,
} from "lucide-react";
import { useUserStore } from "../../store/useUserStore";
import {
  type StockTransferRecord,
  INITIAL_TRANSFERS,
} from "../../data/saasData";
import { db, type ProductItem } from "../../db/db";
import { Modal, formatCurrency } from "@erp-bijoux/shared-ui";

interface MultiStoreScreenProps {
  onNavigateToPos?: () => void;
}

export function MultiStoreScreen({ onNavigateToPos }: MultiStoreScreenProps) {
  const { tenant, stores, currentStore, switchStore, currentSeller } = useUserStore();

  const [activeTab, setActiveTab] = useState<"STORES" | "TRANSFERS" | "NEW_TRANSFER">("STORES");
  const [transfers, setTransfers] = useState<StockTransferRecord[]>(() => {
    try {
      const saved = localStorage.getItem("erp_bijoux_transfers");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TRANSFERS;
  });

  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [searchTransferFilter, setSearchTransferFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "EN_TRANSIT" | "VALIDE">("ALL");

  // Transfer Slip Printable Preview Modal
  const [previewTransfer, setPreviewTransfer] = useState<StockTransferRecord | null>(null);

  // New Transfer Form State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [sourceStoreId, setSourceStoreId] = useState<string>(currentStore?.id || stores[0]?.id || "");
  const [targetStoreId, setTargetStoreId] = useState<string>(
    stores.find((s) => s.id !== currentStore?.id)?.id || stores[1]?.id || stores[0]?.id || ""
  );
  const [originLocation, setOriginLocation] = useState<"VITRINE" | "COFFRE">("COFFRE");
  const [destLocation, setDestLocation] = useState<"VITRINE" | "COFFRE">("VITRINE");
  const [quantity, setQuantity] = useState<number>(1);
  const [carrier, setCarrier] = useState<string>("Brinks Haute Sécurité (Fourgon Blindé)");
  const [sealNumber, setSealNumber] = useState<string>(`BK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [notes, setNotes] = useState<string>("Transfert inter-boutique pour réassort vitrine & essayage client VIP");
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>("");

  // Load products from Dexie DB
  useEffect(() => {
    db.products
      .toArray()
      .then((items) => {
        setAvailableProducts(items);
        if (items.length > 0 && !selectedProductId) {
          setSelectedProductId(items[0].id);
        }
      })
      .catch((err) => console.warn("Failed loading products for transfer:", err));
  }, [selectedProductId]);

  // Persist transfers to localStorage
  const saveTransfers = (updated: StockTransferRecord[]) => {
    setTransfers(updated);
    try {
      localStorage.setItem("erp_bijoux_transfers", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed saving transfers to localStorage:", e);
    }
  };

  // Validate receiving a transfer
  const handleValidateTransfer = (transferId: string) => {
    const updated = transfers.map((t) => {
      if (t.id === transferId) {
        return {
          ...t,
          status: "VALIDE" as const,
          receiverSellerName: currentSeller.name,
          validatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    saveTransfers(updated);
  };

  // Create new transfer
  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product = availableProducts.find((p) => p.id === selectedProductId);
    const sourceStore = stores.find((s) => s.id === sourceStoreId);
    const targetStore = stores.find((s) => s.id === targetStoreId);

    if (!product || !sourceStore || !targetStore) return;
    if (sourceStoreId === targetStoreId) {
      alert("La boutique d'origine et la boutique de destination doivent être différentes.");
      return;
    }

    const newTransfer: StockTransferRecord = {
      id: `TR-${new Date().getFullYear()}-${String(transfers.length + 43).padStart(4, "0")}`,
      transferNumber: `TR-${new Date().getFullYear()}-${String(transfers.length + 43).padStart(4, "0")}`,
      tenantId: tenant.id,
      sourceStoreId: sourceStore.id,
      sourceStoreName: sourceStore.name,
      targetStoreId: targetStore.id,
      targetStoreName: targetStore.name,
      productReference: product.reference,
      productName: product.name,
      productCategory: product.category,
      unitPriceTTC: product.priceTTC,
      quantity,
      originLocation,
      destinationLocation: destLocation,
      status: "EN_TRANSIT",
      senderSellerName: currentSeller.name,
      carrier,
      sealNumber,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTransfer, ...transfers];
    saveTransfers(updated);
    setFormSuccessMessage(`Bon de transfert n° ${newTransfer.transferNumber} émis avec succès !`);

    // Reset seal number for next time
    setSealNumber(`BK-${Math.floor(100000 + Math.random() * 900000)}`);

    setTimeout(() => {
      setFormSuccessMessage("");
      setActiveTab("TRANSFERS");
    }, 1200);
  };

  // Calculations for KPI cards
  const totalStockCount = stores.reduce((acc, s) => acc + (s.stockCount || 0), 0);
  const totalShowcaseCount = stores.reduce((acc, s) => acc + (s.showcaseCount || 0), 0);
  const totalSafeCount = stores.reduce((acc, s) => acc + (s.safeCount || 0), 0);
  const totalDailyTurnover = stores.reduce((acc, s) => acc + (s.dailyTurnover || 0), 0);
  const totalRegisters = stores.reduce((acc, s) => acc + (s.activeRegisters || 1), 0);
  const activeTransfersCount = transfers.filter((t) => t.status === "EN_TRANSIT").length;

  const filteredTransfers = transfers.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchTransferFilter.trim()) {
      const q = searchTransferFilter.toLowerCase();
      return (
        t.transferNumber.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q) ||
        t.productReference.toLowerCase().includes(q) ||
        t.sourceStoreName.toLowerCase().includes(q) ||
        t.targetStoreName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {/* Top Banner & KPI Strip */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{tenant?.logoIcon || "💎"}</span>
              <h1 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
                {tenant?.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold font-mono">
                {tenant?.plan}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{tenant?.tagline || "Réseau de points de vente joaillerie & orfèvrerie"}</span>
              <span>•</span>
              <span className="font-semibold text-amber-800">
                Boutique de travail actuelle : {currentStore?.name}
              </span>
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("STORES")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "STORES"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Boutiques du Réseau ({stores.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("TRANSFERS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "TRANSFERS"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Transferts de Stock</span>
              {activeTransfersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono">
                  {activeTransfersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("NEW_TRANSFER")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === "NEW_TRANSFER"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Transfert</span>
            </button>
          </div>
        </div>

        {/* Global Network Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Chiffre d'Affaires Réseau (Jour)
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 flex items-baseline gap-2">
              <span>{formatCurrency(totalDailyTurnover)}</span>
              <span className="text-[10px] text-emerald-600 font-semibold font-sans flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14.2%
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Cumul des {stores.length} points de vente
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Stock Réseau Disponible
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {totalStockCount} pièces
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2">
              <span>Vitrine: {totalShowcaseCount}</span>
              <span>•</span>
              <span className="font-semibold text-amber-800">Coffre: {totalSafeCount}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Caisses & Terminaux NF525
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{totalRegisters} caisses actives</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Chiffrement & journaux sécurisés
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Transferts Inter-Magasins
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 flex items-center gap-2">
              <span className="text-amber-600">{activeTransfersCount} en transit</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Convoyeurs blindés & coursiers sécurisés
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* VIEW 1: STORES DIRECTORY */}
        {activeTab === "STORES" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Points de Vente & Boutiques du Réseau</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Consultez le stock vitrine / coffre et basculez instantanément de caisse.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {stores.map((store) => {
                const isCurrent = store.id === currentStore?.id;
                return (
                  <div
                    key={store.id}
                    className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                      isCurrent
                        ? "border-amber-500 ring-2 ring-amber-500/20 bg-gradient-to-b from-amber-50/20 to-white"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {store.name}
                            </h3>
                            {store.isFlagship && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                Flagship
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{store.address}</span>
                          </p>
                        </div>

                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Caisse Active</span>
                          </span>
                        )}
                      </div>

                      {/* Store Meta */}
                      <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Téléphone</span>
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {store.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Poste Caisse</span>
                          <span className="font-mono font-bold text-slate-800">
                            {store.posNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Responsable</span>
                          <span className="font-medium text-slate-700">
                            {store.managerName || "Directeur de Boutique"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">CA Journalier</span>
                          <span className="font-mono font-bold text-amber-800">
                            {formatCurrency(store.dailyTurnover || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Stock Breakdown: Vitrine vs Coffre */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-600" />
                            <span>Stock Total</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {store.stockCount} pièces
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Vitrine</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {store.showcaseCount} pcs
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Coffre-fort</span>
                            <span className="font-mono font-bold text-amber-800 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-600" />
                              {store.safeCount} pcs
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center gap-2">
                      {isCurrent ? (
                        <button
                          onClick={onNavigateToPos}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors text-center"
                        >
                          Aller à la Caisse (F12)
                        </button>
                      ) : (
                        <button
                          onClick={() => switchStore(store.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          <span>Basculer sur cette boutique</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setTargetStoreId(store.id);
                          setActiveTab("NEW_TRANSFER");
                        }}
                        title="Transférer des pièces vers cette boutique"
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                      >
                        Transférer →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: INTER-STORE TRANSFERS LIST */}
        {activeTab === "TRANSFERS" && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, bijou, boutique..."
                  value={searchTransferFilter}
                  onChange={(e) => setSearchTransferFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    statusFilter === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tous ({transfers.length})
                </button>
                <button
                  onClick={() => setStatusFilter("EN_TRANSIT")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    statusFilter === "EN_TRANSIT"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  En Transit ({transfers.filter((t) => t.status === "EN_TRANSIT").length})
                </button>
                <button
                  onClick={() => setStatusFilter("VALIDE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    statusFilter === "VALIDE"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Validés ({transfers.filter((t) => t.status === "VALIDE").length})
                </button>
              </div>
            </div>

            {/* Transfers List Cards */}
            <div className="space-y-3">
              {filteredTransfers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
                  <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Aucun bon de transfert trouvé</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Créez un nouveau transfert pour approvisionner une autre boutique.
                  </p>
                </div>
              ) : (
                filteredTransfers.map((t) => {
                  const isTransit = t.status === "EN_TRANSIT";
                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Transfer details & route */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {t.transferNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isTransit
                                ? "bg-amber-50 text-amber-900 border border-amber-300 animate-pulse"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {isTransit ? (
                              <>
                                <Truck className="w-3 h-3 text-amber-600" />
                                <span>En Transit Sécurisé</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Réception Validée</span>
                              </>
                            )}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            Émis le {new Date(t.createdAt).toLocaleDateString("fr-FR")} à{" "}
                            {new Date(t.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Article Info */}
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{t.productName}</span>
                          <span className="text-xs font-mono font-normal text-slate-500">
                            ({t.productReference})
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-800 ml-auto md:ml-2">
                            {formatCurrency(t.unitPriceTTC * t.quantity)} ({t.quantity} pièce)
                          </span>
                        </div>

                        {/* Route: Source -> Target */}
                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            De: {t.sourceStoreName} ({t.originLocation})
                          </span>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            Vers: {t.targetStoreName} ({t.destinationLocation})
                          </span>
                        </div>

                        {/* Carrier & Tracking */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                          <span>Transporteur: <strong>{t.carrier}</strong></span>
                          {t.sealNumber && (
                            <span>Scellé: <strong className="font-mono text-slate-700">{t.sealNumber}</strong></span>
                          )}
                          <span>Par: <strong>{t.senderSellerName}</strong></span>
                        </div>

                        {t.notes && (
                          <div className="text-[11px] text-slate-400 italic">
                            « {t.notes} »
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {isTransit && (
                          <button
                            onClick={() => handleValidateTransfer(t.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Valider la Réception</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPreviewTransfer(t)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
                          title="Imprimer le bordereau de transfert"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Bordereau</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: NEW TRANSFER FORM */}
        {activeTab === "NEW_TRANSFER" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Logistique Sécurisée Inter-Magasins</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                Émettre un Bon de Transfert de Bijou
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Expédiez une pièce d'un magasin vers un autre sous pli scellé et valeur déclarée.
              </p>
            </div>

            {formSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateTransferSubmit} className="space-y-5">
              {/* Select Product */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  1. Pièce de Joaillerie à Transférer
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.reference}] {p.name} — {formatCurrency(p.priceTTC)} (Vitrine: {p.stockVitrine} / Coffre: {p.stockCoffre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Destination grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/90">
                {/* Source */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-600" />
                    <span>Origine (Expéditeur)</span>
                  </span>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Boutique Source</label>
                    <select
                      value={sourceStoreId}
                      onChange={(e) => setSourceStoreId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Emplacement de Retrait</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOriginLocation("COFFRE")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${
                          originLocation === "COFFRE"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Coffre-fort
                      </button>
                      <button
                        type="button"
                        onClick={() => setOriginLocation("VITRINE")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${
                          originLocation === "VITRINE"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Vitrine
                      </button>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Destination (Destinataire)</span>
                  </span>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Boutique Cible</label>
                    <select
                      value={targetStoreId}
                      onChange={(e) => setTargetStoreId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Emplacement de Dépôt</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDestLocation("VITRINE")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${
                          destLocation === "VITRINE"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Vitrine
                      </button>
                      <button
                        type="button"
                        onClick={() => setDestLocation("COFFRE")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${
                          destLocation === "COFFRE"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Coffre-fort
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Convoyeur / Transporteur
                  </label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  >
                    <option value="Brinks Haute Sécurité (Fourgon Blindé)">
                      Brinks Haute Sécurité (Fourgon Blindé)
                    </option>
                    <option value="Loomis Valeur Déclarée Express">
                      Loomis Valeur Déclarée Express
                    </option>
                    <option value="Coursier Maison Joaillerie">
                      Coursier Maison Joaillerie
                    </option>
                    <option value="Transporteur Sécurisé Partenaire">
                      Transporteur Sécurisé Partenaire
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    N° Scellé de Sécurité
                  </label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Motif & Notes du Transfert
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Demande client VIP pour essayage privé ce samedi..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Émis par : <strong>{currentSeller.name}</strong> ({currentSeller.role})
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Valider & Émettre le Bon de Transfert</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Printable Transfer Slip Modal */}
      {previewTransfer && (
        <Modal
          isOpen={!!previewTransfer}
          onClose={() => setPreviewTransfer(null)}
          title="Bordereau de Transfert Inter-Magasins Sécurisé"
          description={`Référence Bon n° ${previewTransfer.transferNumber} • Valeur Déclarée`}
        >
          <div className="space-y-4">
            {/* Visual Paper Slip */}
            <div className="bg-slate-50 border border-slate-300 p-6 rounded-2xl font-mono text-xs space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <div>
                  <div className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                    {tenant?.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    BORDEREAU D'EXPÉDITION INTER-BOUTIQUES
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-800">
                    {previewTransfer.transferNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(previewTransfer.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="font-bold block text-slate-700">EXPÉDITEUR :</span>
                  <span>{previewTransfer.sourceStoreName}</span>
                  <span className="block text-slate-500">
                    Emplacement : {previewTransfer.originLocation}
                  </span>
                  <span className="block text-slate-500">
                    Par : {previewTransfer.senderSellerName}
                  </span>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">DESTINATAIRE :</span>
                  <span>{previewTransfer.targetStoreName}</span>
                  <span className="block text-slate-500">
                    Emplacement cible : {previewTransfer.destinationLocation}
                  </span>
                  <span className="block text-slate-500">
                    Réceptionné par : {previewTransfer.receiverSellerName || "En attente"}
                  </span>
                </div>
              </div>

              <div className="border-t border-b border-slate-300 py-3 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>DÉSIGNATION DE L'OUVRAGE</span>
                  <span>VALEUR DÉCLARÉE TTC</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>
                    {previewTransfer.productName} ({previewTransfer.productReference}) x{previewTransfer.quantity}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(previewTransfer.unitPriceTTC * previewTransfer.quantity)}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div>Transporteur : <strong>{previewTransfer.carrier}</strong></div>
                <div>Numéro de scellé blindé : <strong>{previewTransfer.sealNumber}</strong></div>
                {previewTransfer.notes && <div>Motif : {previewTransfer.notes}</div>}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-300 text-[10px]">
                <div className="border border-slate-200 p-2 rounded bg-white">
                  <span className="block font-bold">Visa Expéditeur :</span>
                  <div className="h-10 text-slate-400 italic pt-2">Signé électroniquement</div>
                </div>
                <div className="border border-slate-200 p-2 rounded bg-white">
                  <span className="block font-bold">Visa Réceptionnaire / Coffre :</span>
                  <div className="h-10 text-slate-400 italic pt-2">
                    {previewTransfer.status === "VALIDE"
                      ? `Contrôlé et pesé par ${previewTransfer.receiverSellerName}`
                      : "En attente de déchargement"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer le Bordereau</span>
              </button>

              <button
                onClick={() => setPreviewTransfer(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
