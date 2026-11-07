import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  ArrowLeftRight,
  Printer,
  ShoppingBag,
  Plus,
  Eye,
  Sparkles,
  CheckCircle2,
  LayoutGrid,
  List,
  Scale,
  Gem,
  Store,
  Vault,
  Truck,
  Building2,
  Barcode,
  Tag,
} from "lucide-react";
import { db, type ProductItem } from "../../db/db";
import { usePosStore } from "../../store/usePosStore";
import { useUserStore } from "../../store/useUserStore";
import { type StockTransferRecord } from "../../data/saasData";
import { Modal, Badge, Button, Input } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatWeight } from "@erp-bijoux/shared-ui";
import { JewelryLabelStudioModal } from "../hardware/JewelryLabelStudioModal";
import { BarcodeScannerModal } from "../hardware/BarcodeScannerModal";

interface StockInventoryScreenProps {
  onNavigateToPos?: () => void;
}

export function StockInventoryScreen({ onNavigateToPos }: StockInventoryScreenProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<"ALL" | "VITRINE" | "COFFRE">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<ProductItem | null>(null);
  const [transferDirection, setTransferDirection] = useState<"TO_COFFRE" | "TO_VITRINE">("TO_COFFRE");
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Jewelry Barbell Studio & Barcode Scanner states
  const [isLabelStudioOpen, setIsLabelStudioOpen] = useState(false);
  const [labelStudioProduct, setLabelStudioProduct] = useState<ProductItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { stores, currentStore, currentSeller, tenant } = useUserStore();
  const [isInterStoreModalOpen, setIsInterStoreModalOpen] = useState(false);
  const [interStoreTarget, setInterStoreTarget] = useState<ProductItem | null>(null);
  const [interStoreDestId, setInterStoreDestId] = useState<string>(
    stores.find((s) => s.id !== currentStore?.id)?.id || (stores[1] ? stores[1].id : "store-vendome-cannes")
  );
  const [interStoreCarrier, setInterStoreCarrier] = useState<string>("Brinks Haute Sécurité (Fourgon Blindé)");
  const [interStoreQuantity, setInterStoreQuantity] = useState<number>(1);
  const [interStoreNotes, setInterStoreNotes] = useState<string>("Réassort vitrine inter-boutiques");

  const { addToCart } = usePosStore();

  const loadProducts = async () => {
    const all = await db.products.toArray();
    setProducts(all);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  // Quick stats
  const stats = useMemo(() => {
    const totalCount = products.reduce((acc, p) => acc + (p.stockVitrine + p.stockCoffre), 0);
    const vitrineCount = products.reduce((acc, p) => acc + p.stockVitrine, 0);
    const coffreCount = products.reduce((acc, p) => acc + p.stockCoffre, 0);
    const totalValuation = products.reduce(
      (acc, p) => acc + p.priceTTC * (p.stockVitrine + p.stockCoffre),
      0
    );
    const lowStockCount = products.filter((p) => p.stockVitrine === 0 && p.stockCoffre === 0).length;
    return { totalCount, vitrineCount, coffreCount, totalValuation, lowStockCount };
  }, [products]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;

      // Location filter
      let matchesLocation = true;
      if (locationFilter === "VITRINE") {
        matchesLocation = p.stockVitrine > 0;
      } else if (locationFilter === "COFFRE") {
        matchesLocation = p.stockCoffre > 0;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.metalType && p.metalType.toLowerCase().includes(q)) ||
        (p.diamond4C && `diamant ${p.diamond4C.carat}ct`.includes(q));

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [products, selectedCategory, locationFilter, searchQuery]);

  // Transfer stock between vitrine & coffre
  const handleTransferStock = async () => {
    if (!transferTarget) return;

    let newVitrine = transferTarget.stockVitrine;
    let newCoffre = transferTarget.stockCoffre;

    if (transferDirection === "TO_COFFRE") {
      if (newVitrine < transferQuantity) return;
      newVitrine -= transferQuantity;
      newCoffre += transferQuantity;
    } else {
      if (newCoffre < transferQuantity) return;
      newCoffre -= transferQuantity;
      newVitrine += transferQuantity;
    }

    await db.products.update(transferTarget.id, {
      stockVitrine: newVitrine,
      stockCoffre: newCoffre,
    });

    await loadProducts();
    setIsTransferModalOpen(false);
    setNotification({
      type: "success",
      message: `Transfert de ${transferQuantity} pièce(s) effectué pour ${transferTarget.name} (${
        transferDirection === "TO_COFFRE" ? "Vitrine → Coffre" : "Coffre → Vitrine"
      })`,
    });
  };

  // Inter-store transfer with carrier and backend API
  const handleInterStoreTransfer = async () => {
    if (!interStoreTarget) return;
    const targetStore = stores.find((s) => s.id === interStoreDestId) || stores[1] || stores[0];

    // Deduct stock locally
    let remaining = interStoreQuantity;
    let newVitrine = interStoreTarget.stockVitrine;
    let newCoffre = interStoreTarget.stockCoffre;

    if (newCoffre >= remaining) {
      newCoffre -= remaining;
      remaining = 0;
    } else {
      remaining -= newCoffre;
      newCoffre = 0;
      newVitrine = Math.max(0, newVitrine - remaining);
    }

    await db.products.update(interStoreTarget.id, {
      stockVitrine: newVitrine,
      stockCoffre: newCoffre,
    });

    // Send to backend Spring Boot API
    try {
      await fetch(`/api/v1/stock/items/${interStoreTarget.id}/transfer-store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": "1",
        },
        body: JSON.stringify({
          targetStoreId: 2,
          reason: interStoreNotes,
        }),
      });
    } catch (err) {
      console.warn("Backend stock transfer offline, local transfer logged:", err);
    }

    // Save into transfers registry
    const newRecord: StockTransferRecord = {
      id: `trans-${Date.now()}`,
      transferNumber: `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      tenantId: tenant?.id || "tenant-vendome",
      sourceStoreId: currentStore?.id || "store-vendome-paris",
      sourceStoreName: currentStore?.name || "Boutique Vendôme",
      targetStoreId: targetStore.id,
      targetStoreName: targetStore.name,
      productReference: interStoreTarget.reference,
      productName: interStoreTarget.name,
      productCategory: interStoreTarget.category,
      unitPriceTTC: interStoreTarget.priceTTC,
      quantity: interStoreQuantity,
      originLocation: "COFFRE",
      destinationLocation: "VITRINE",
      carrier: interStoreCarrier,
      sealNumber: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: interStoreNotes,
      status: "EN_TRANSIT",
      senderSellerName: currentSeller?.name || "Vendeuse",
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("erp_bijoux_transfers") || "[]");
      localStorage.setItem("erp_bijoux_transfers", JSON.stringify([newRecord, ...existing]));
    } catch (e) {
      console.warn("Failed saving transfer record:", e);
    }

    setIsInterStoreModalOpen(false);
    setNotification({
      type: "success",
      message: `Expédition inter-boutique initiée vers ${targetStore.name} via ${interStoreCarrier} (Scellé n° ${newRecord.sealNumber})`,
    });
    await loadProducts();
  };

  const handlePrintLabel = (product: ProductItem) => {
    handleOpenLabelStudio(product);
  };

  const handleOpenLabelStudio = (product?: ProductItem) => {
    setLabelStudioProduct(product || null);
    setIsLabelStudioOpen(true);
  };

  const handleAddToCart = (product: ProductItem) => {
    addToCart(product);
    setNotification({
      type: "success",
      message: `${product.name} ajouté au panier avec succès !`,
    });
  };

  const categories = [
    { id: "all", label: "Tout le Catalogue" },
    { id: "bague", label: "Bagues & Solitaires" },
    { id: "collier", label: "Colliers & Pendentifs" },
    { id: "bracelet", label: "Bracelets & Rivières" },
    { id: "boucles", label: "Boucles d'oreilles" },
    { id: "montre", label: "Horlogerie" },
    { id: "matiere", label: "Matières & Lingots" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200/90 shadow-xl text-xs font-semibold text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification.message}</span>
          {onNavigateToPos && (
            <button
              onClick={onNavigateToPos}
              className="ml-2 text-amber-700 underline font-bold hover:text-amber-800"
            >
              Voir panier
            </button>
          )}
        </div>
      )}

      {/* Top Inventory Dashboard Stats */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
                <Package className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Stock & Catalogue Joaillerie</span>
                  <Badge variant="outline" className="text-[11px] font-mono text-slate-500">
                    {filteredProducts.length} référence(s)
                  </Badge>
                </h1>
                <p className="text-xs text-slate-500">
                  Inventaire temps réel • Gestion des emplacements Vitrine & Coffre-fort • Impression ZPL
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Valeur Stock TTC</div>
                <div className="text-xs font-bold font-mono text-slate-900">
                  {formatCurrency(stats.totalValuation)}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Stock Vitrine</div>
                <div className="text-xs font-bold font-mono text-slate-900">{stats.vitrineCount} pcs</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
              <Vault className="w-3.5 h-3.5 text-slate-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Stock Coffre</div>
                <div className="text-xs font-bold font-mono text-slate-900">{stats.coffreCount} pcs</div>
              </div>
            </div>

            {/* Barcode Scanner Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
              title="Scanner un bijou pour filtrer ou voir sa fiche"
            >
              <Barcode className="w-3.5 h-3.5 text-amber-600" />
              <span>Scanner</span>
            </button>

            {/* Jewelry Barbell Label Studio */}
            <button
              onClick={() => handleOpenLabelStudio()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              title="Créer et imprimer des étiquettes haltères avec codes-barres"
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Studio Étiquettes</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs font-medium"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Vue Tableau synthétique"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs font-medium"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Vue Grille visuelle"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === c.id
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 border border-transparent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Location & Search */}
          <div className="flex items-center gap-2">
            {/* Location selector pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setLocationFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  locationFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tous ({stats.totalCount})
              </button>
              <button
                onClick={() => setLocationFilter("VITRINE")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  locationFilter === "VITRINE"
                    ? "bg-white text-amber-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Store className="w-3 h-3 text-amber-600" />
                <span>Vitrine ({stats.vitrineCount})</span>
              </button>
              <button
                onClick={() => setLocationFilter("COFFRE")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  locationFilter === "COFFRE"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Vault className="w-3 h-3 text-slate-600" />
                <span>Coffre ({stats.coffreCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="w-56 md:w-64">
              <Input
                placeholder="Rechercher réf, métal, 4C..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            <Package className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Aucun bijou ne correspond aux critères</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Essayez de réinitialiser la recherche ou de changer les filtres d'emplacement (Vitrine / Coffre).
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setLocationFilter("ALL");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW */
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Bijou & Référence</th>
                    <th className="py-3 px-3">Métal & Titre</th>
                    <th className="py-3 px-3">Poids & Pierres</th>
                    <th className="py-3 px-3">Tour Doigt</th>
                    <th className="py-3 px-3 text-center">Stock Vitrine</th>
                    <th className="py-3 px-3 text-center">Stock Coffre</th>
                    <th className="py-3 px-3 text-right">Prix TTC</th>
                    <th className="py-3 px-4 text-right">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.stockVitrine === 0 && p.stockCoffre === 0;
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isOutOfStock ? "bg-rose-50/20 opacity-75" : ""
                        }`}
                      >
                        {/* Jewel & Ref */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Sparkles className="w-5 h-5 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[11px] text-slate-500">{p.reference}</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-mono text-[10px] text-slate-400">{p.barcode}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Metal */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 capitalize">
                            {p.metalType ? p.metalType.replace("_", " ") : "Non spécifié"}
                          </div>
                          {p.goldCarats && (
                            <Badge variant="gold" size="sm" className="mt-0.5">
                              {p.goldCarats.toUpperCase()}
                            </Badge>
                          )}
                        </td>

                        {/* Weight & 4C */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-medium text-slate-800">
                            {p.weightGrams ? formatWeight(p.weightGrams) : "—"}
                          </div>
                          {p.diamond4C && (
                            <div className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 mt-0.5 inline-flex items-center gap-1 font-mono">
                              <Gem className="w-2.5 h-2.5 text-amber-600" />
                              <span>
                                {p.diamond4C.carat}ct {p.diamond4C.color}/{p.diamond4C.clarity}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Finger Size */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {p.fingerSize ? `T${p.fingerSize}` : "—"}
                        </td>

                        {/* Vitrine Stock */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full font-bold font-mono text-xs ${
                              p.stockVitrine > 0
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/90"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {p.stockVitrine}
                          </span>
                        </td>

                        {/* Coffre Stock */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full font-bold font-mono text-xs ${
                              p.stockCoffre > 0
                                ? "bg-amber-50 text-amber-900 border border-amber-200/90"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {p.stockCoffre}
                          </span>
                        </td>

                        {/* Price TTC */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-black text-slate-900 font-mono text-sm">
                            {formatCurrency(p.priceTTC)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            TVA {(p.vatRate * 100).toFixed(0)}%
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Transfer Vitrine <-> Coffre */}
                            <button
                              onClick={() => {
                                setTransferTarget(p);
                                setTransferDirection(p.stockVitrine > 0 ? "TO_COFFRE" : "TO_VITRINE");
                                setTransferQuantity(1);
                                setIsTransferModalOpen(true);
                              }}
                              title="Transférer Vitrine ⇄ Coffre"
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                            </button>

                            {/* Transfer Inter-Store */}
                            <button
                              onClick={() => {
                                setInterStoreTarget(p);
                                setInterStoreQuantity(1);
                                setIsInterStoreModalOpen(true);
                              }}
                              title="Expédier vers une autre boutique (Brinks)"
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                            >
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            {/* Print ZPL Label */}
                            <button
                              onClick={() => handlePrintLabel(p)}
                              title="Imprimer étiquette bijou Zebra ZPL"
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => setSelectedProduct(p)}
                              title="Voir fiche complète"
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            {/* Add to POS Cart */}
                            <button
                              onClick={() => handleAddToCart(p)}
                              title="Ajouter au Panier Caisse"
                              className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Vendre</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stockVitrine === 0 && p.stockCoffre === 0;
              return (
                <div
                  key={p.id}
                  className={`bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all duration-200 ${
                    isOutOfStock ? "opacity-75" : ""
                  }`}
                >
                  <div>
                    {/* Image Header with stock badges */}
                    <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                        />
                      ) : (
                        <Sparkles className="w-12 h-12 text-amber-500/50" />
                      )}

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                        {p.goldCarats && (
                          <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-bold text-amber-900 border border-slate-200 shadow-xs">
                            {p.goldCarats.toUpperCase()}
                          </span>
                        )}
                        {p.fingerSize && (
                          <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 border border-slate-200 shadow-xs font-mono">
                            T{p.fingerSize}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs ${
                            p.stockVitrine > 0
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-300 text-slate-700"
                          }`}
                        >
                          Vitrine : {p.stockVitrine}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs ${
                            p.stockCoffre > 0
                              ? "bg-amber-600 text-white"
                              : "bg-slate-300 text-slate-700"
                          }`}
                        >
                          Coffre : {p.stockCoffre}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h3>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{p.reference}</p>
                        </div>
                      </div>

                      {/* Technical specifications */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        {p.weightGrams && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Scale className="w-3 h-3 text-slate-400" />
                            {formatWeight(p.weightGrams)}
                          </span>
                        )}
                        {p.diamond4C && (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Gem className="w-3 h-3 text-amber-600" />
                            {p.diamond4C.carat}ct {p.diamond4C.color}/{p.diamond4C.clarity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Price & Actions */}
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {formatCurrency(p.priceTTC)}
                      </div>
                      <div className="text-[10px] text-slate-400">TTC</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setTransferTarget(p);
                          setTransferDirection(p.stockVitrine > 0 ? "TO_COFFRE" : "TO_VITRINE");
                          setTransferQuantity(1);
                          setIsTransferModalOpen(true);
                        }}
                        title="Transférer Vitrine ⇄ Coffre"
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                      </button>

                      <button
                        onClick={() => {
                          setInterStoreTarget(p);
                          setInterStoreQuantity(1);
                          setIsInterStoreModalOpen(true);
                        }}
                        title="Expédier vers une autre boutique (Brinks)"
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      <button
                        onClick={() => handlePrintLabel(p)}
                        title="Imprimer étiquette Zebra"
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                      </button>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(p)}
                        className="px-3 text-xs gap-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Vendre</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Stock Modal */}
      {transferTarget && (
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-600" />
              <span>Transfert de Stock Interne</span>
            </div>
          }
          description={`Déplacement de pièces pour : ${transferTarget.name} (${transferTarget.reference})`}
          maxWidth="md"
        >
          <div className="space-y-5">
            {/* Current Stock Snapshot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>Stock Vitrine Actuel</span>
                </div>
                <div className="text-xl font-black font-mono text-slate-900">
                  {transferTarget.stockVitrine} pièces
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                  <Vault className="w-3.5 h-3.5 text-slate-600" />
                  <span>Stock Coffre-fort Actuel</span>
                </div>
                <div className="text-xl font-black font-mono text-slate-900">
                  {transferTarget.stockCoffre} pièces
                </div>
              </div>
            </div>

            {/* Direction Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Direction du transfert</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransferDirection("TO_COFFRE")}
                  disabled={transferTarget.stockVitrine === 0}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    transferDirection === "TO_COFFRE"
                      ? "border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20 text-slate-900 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Vitrine → Coffre</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Rangement en fin de journée
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferDirection("TO_VITRINE")}
                  disabled={transferTarget.stockCoffre === 0}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    transferDirection === "TO_VITRINE"
                      ? "border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20 text-slate-900 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Coffre → Vitrine</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Mise en vitrine d'exposition
                  </div>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Quantité à transférer</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={
                    transferDirection === "TO_COFFRE"
                      ? transferTarget.stockVitrine
                      : transferTarget.stockCoffre
                  }
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleTransferStock}>
                Confirmer le déplacement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inter-Store Transfer Modal */}
      {interStoreTarget && (
        <Modal
          isOpen={isInterStoreModalOpen}
          onClose={() => setIsInterStoreModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>Expédition Inter-Boutiques Sécurisée</span>
            </div>
          }
          description={`Pièce de Joaillerie : ${interStoreTarget.name} (${interStoreTarget.reference})`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-start gap-3 text-xs text-blue-950">
              <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Transfert de Valeurs Déclarées</p>
                <p className="text-[11px] text-blue-900/90 mt-0.5">
                  Départ : <strong>{currentStore?.name || "Boutique Vendôme"}</strong>. Le transfert génère un bordereau scellé inaltérable et met à jour l'inventaire en temps réel.
                </p>
              </div>
            </div>

            {/* Destination Store */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Boutique Destinataire *
              </label>
              <select
                value={interStoreDestId}
                onChange={(e) => setInterStoreDestId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {stores
                  .filter((s) => s.id !== currentStore?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
              </select>
            </div>

            {/* Carrier */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Transporteur Agréé Transport de Valeurs *
              </label>
              <select
                value={interStoreCarrier}
                onChange={(e) => setInterStoreCarrier(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Brinks Haute Sécurité (Fourgon Blindé)">
                  Brinks Haute Sécurité (Fourgon Blindé)
                </option>
                <option value="Loomis Transport de Valeurs">
                  Loomis Transport de Valeurs
                </option>
                <option value="Coursier Sécurisé Maison Vendôme">
                  Coursier Sécurisé Maison Vendôme
                </option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quantité à Expédier (Dispo Coffre: {interStoreTarget.stockCoffre}, Vitrine: {interStoreTarget.stockVitrine})
              </label>
              <input
                type="number"
                min={1}
                max={interStoreTarget.stockCoffre + interStoreTarget.stockVitrine}
                value={interStoreQuantity}
                onChange={(e) =>
                  setInterStoreQuantity(
                    Math.min(
                      interStoreTarget.stockCoffre + interStoreTarget.stockVitrine,
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  )
                }
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Motif / Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Motif du Transfert
              </label>
              <input
                type="text"
                value={interStoreNotes}
                onChange={(e) => setInterStoreNotes(e.target.value)}
                placeholder="Ex: Demande client VIP pour essayage privé ce samedi..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInterStoreModalOpen(false)}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={handleInterStoreTransfer}>
                Émettre le Bordereau d'Expédition
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>Fiche Détail Produit</span>
            </div>
          }
          description={`Référence : ${selectedProduct.reference} • EAN : ${selectedProduct.barcode}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="w-36 h-36 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-10 h-10 text-amber-500 m-auto mt-12" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-base font-bold text-slate-900">{selectedProduct.name}</h3>
                <div className="text-xl font-black font-mono text-slate-900">
                  {formatCurrency(selectedProduct.priceTTC)}
                </div>
                <div className="text-xs text-slate-500">
                  TVA {(selectedProduct.vatRate * 100).toFixed(0)}% • Prix HT :{" "}
                  {formatCurrency(selectedProduct.priceTTC / (1 + selectedProduct.vatRate))}
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {selectedProduct.goldCarats && (
                    <Badge variant="gold">Or {selectedProduct.goldCarats.toUpperCase()}</Badge>
                  )}
                  {selectedProduct.weightGrams && (
                    <Badge variant="default">Poids : {formatWeight(selectedProduct.weightGrams)}</Badge>
                  )}
                  {selectedProduct.fingerSize && (
                    <Badge variant="default">Tour : {selectedProduct.fingerSize}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 4C Diamond specification if present */}
            {selectedProduct.diamond4C && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Gem className="w-4 h-4 text-amber-600" />
                  <span>Certificat & Caractéristiques Gemmologiques (4C)</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Carat</div>
                    <div className="font-mono font-bold text-slate-900">{selectedProduct.diamond4C.carat} ct</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Couleur</div>
                    <div className="font-mono font-bold text-slate-900">{selectedProduct.diamond4C.color}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Pureté</div>
                    <div className="font-mono font-bold text-slate-900">{selectedProduct.diamond4C.clarity}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Taille</div>
                    <div className="font-mono font-bold text-slate-900">{selectedProduct.diamond4C.cut}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintLabel(selectedProduct)}
                className="gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Étiquette ZPL</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                  Fermer
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Ajouter au Panier</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Visual Jewelry Barbell Label Studio */}
      <JewelryLabelStudioModal
        isOpen={isLabelStudioOpen}
        onClose={() => {
          setIsLabelStudioOpen(false);
          loadProducts(); // reload in case product barcode was changed!
        }}
        initialProduct={labelStudioProduct}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code, product) => {
          if (product) {
            setSelectedProduct(product);
            setSearchQuery(code);
          } else {
            setSearchQuery(code);
          }
        }}
      />
    </div>
  );
}
