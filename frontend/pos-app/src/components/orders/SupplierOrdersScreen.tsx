import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Package,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Store,
  Vault,
  Building2,
  Trash2,
  Send,
  Eye,
  Check,
  Tag,
} from "lucide-react";
import {
  db,
  type SupplierOrderRecord,
  type SupplierOrderItem,
  type ProductItem,
} from "../../db/db";
import { useHardwareStore } from "../../store/useHardwareStore";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatDateOnly } from "@erp-bijoux/shared-ui";

interface SupplierOrdersScreenProps {
  onNavigateToStock?: () => void;
}

const PRESET_SUPPLIERS = [
  {
    name: "Diamantaire Anvers - Diamond Bourse NV",
    contact: "Marc Van Der Meer (+32 3 226 89 00)",
    country: "Belgique (Anvers)",
    defaultVat: 0.0,
  },
  {
    name: "Fonderie & Fonte Lyonnaise d'Alliages Précieux",
    contact: "Jean-Luc Perrin (+33 4 78 28 11 00)",
    country: "France (Lyon)",
    defaultVat: 0.2,
  },
  {
    name: "Manufacture Italienne Chaînes & Apprêts Valenza",
    contact: "Matteo Rossi (+39 0131 954 11)",
    country: "Italie (Valenza)",
    defaultVat: 0.2,
  },
  {
    name: "Ceylon Gems & Natural Sapphires Ltd",
    contact: "Aruna Wijesinghe (+94 11 234 5678)",
    country: "Sri Lanka (Colombo)",
    defaultVat: 0.0,
  },
];

export function SupplierOrdersScreen({ onNavigateToStock }: SupplierOrdersScreenProps) {
  const [orders, setOrders] = useState<SupplierOrderRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "COMMANDEE" | "BROUILLON" | "RECEPTIONNEE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<SupplierOrderRecord | null>(null);
  const [receptionTargetLocation, setReceptionTargetLocation] = useState<"VITRINE" | "COFFRE">("VITRINE");
  const [zebraBatchOrder, setZebraBatchOrder] = useState<SupplierOrderRecord | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<SupplierOrderRecord | null>(null);

  // New Order Form state
  const [newSupplierName, setNewSupplierName] = useState(PRESET_SUPPLIERS[0].name);
  const [newSupplierContact, setNewSupplierContact] = useState(PRESET_SUPPLIERS[0].contact);
  const [newSupplierCountry, setNewSupplierCountry] = useState(PRESET_SUPPLIERS[0].country);
  const [newOrderNotes, setNewOrderNotes] = useState("");
  const [newItems, setNewItems] = useState<SupplierOrderItem[]>([
    {
      reference: "DIA-RND-070-E",
      name: "Diamant Rond Brillant 0.70ct E/VS1 GIA",
      category: "matiere",
      quantity: 1,
      unitCostHT: 2450.0,
      vatRate: 0.0,
      totalHT: 2450.0,
      diamond4C: { carat: 0.7, color: "E", clarity: "VS1", cut: "Excellent" },
    },
  ]);

  // Form item inputs for adding
  const [itemInputRef, setItemInputRef] = useState("");
  const [itemInputName, setItemInputName] = useState("");
  const [itemInputCategory, setItemInputCategory] = useState<ProductItem["category"]>("bague");
  const [itemInputQty, setItemInputQty] = useState<number>(1);
  const [itemInputCostHT, setItemInputCostHT] = useState<number>(180.0);
  const [itemInputVat, setItemInputVat] = useState<number>(0.2);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const { printJewelryLabel } = useHardwareStore();

  const loadOrdersAndProducts = async () => {
    const [allOrders, allProds] = await Promise.all([
      db.supplierOrders.reverse().toArray(),
      db.products.toArray(),
    ]);
    setOrders(allOrders);
    setCatalogProducts(allProds);
  };

  useEffect(() => {
    loadOrdersAndProducts();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  // Metrics
  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.status === "COMMANDEE");
    const receivedOrders = orders.filter((o) => o.status === "RECEPTIONNEE");
    const draftOrders = orders.filter((o) => o.status === "BROUILLON");

    const pendingAmountHT = pendingOrders.reduce((sum, o) => sum + o.totalHT, 0);
    const totalPendingPieces = pendingOrders.reduce(
      (sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    return {
      pendingCount: pendingOrders.length,
      pendingAmountHT,
      receivedCount: receivedOrders.length,
      draftCount: draftOrders.length,
      totalPendingPieces,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = activeTab === "ALL" || o.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.items.some(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            it.reference.toLowerCase().includes(q)
        );
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  // Handle supplier preset change
  const handleSelectPresetSupplier = (supplierName: string) => {
    const found = PRESET_SUPPLIERS.find((s) => s.name === supplierName);
    if (found) {
      setNewSupplierName(found.name);
      setNewSupplierContact(found.contact);
      setNewSupplierCountry(found.country);
      setItemInputVat(found.defaultVat);
    }
  };

  // Add item to draft list
  const handleAddItemToOrder = () => {
    if (!itemInputName.trim() || itemInputQty <= 0 || itemInputCostHT < 0) return;
    const ref = itemInputRef.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalHT = itemInputCostHT * itemInputQty;

    const newItem: SupplierOrderItem = {
      reference: ref,
      name: itemInputName.trim(),
      category: itemInputCategory,
      quantity: itemInputQty,
      unitCostHT: itemInputCostHT,
      vatRate: itemInputVat,
      totalHT,
    };

    setNewItems([...newItems, newItem]);
    setItemInputRef("");
    setItemInputName("");
    setItemInputQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setNewItems(newItems.filter((_, idx) => idx !== index));
  };

  // Save order (Brouillon or Commandée)
  const handleSaveOrder = async (status: "BROUILLON" | "COMMANDEE") => {
    if (newItems.length === 0) {
      alert("Veuillez ajouter au moins une référence d'article.");
      return;
    }

    const orderNumber = `CMD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const totalHT = newItems.reduce((sum, it) => sum + it.totalHT, 0);
    const totalVAT = newItems.reduce((sum, it) => sum + it.totalHT * it.vatRate, 0);
    const totalTTC = totalHT + totalVAT;

    const newOrder: SupplierOrderRecord = {
      id: `order-${Date.now()}`,
      orderNumber,
      supplierName: newSupplierName,
      supplierContact: newSupplierContact,
      supplierCountry: newSupplierCountry,
      status,
      items: [...newItems],
      totalHT,
      totalVAT,
      totalTTC,
      notes: newOrderNotes,
      createdAt: new Date().toISOString(),
      orderedAt: status === "COMMANDEE" ? new Date().toISOString() : undefined,
    };

    await db.supplierOrders.add(newOrder);
    await loadOrdersAndProducts();
    setIsNewOrderModalOpen(false);
    setNotification({
      message:
        status === "COMMANDEE"
          ? `Commande ${orderNumber} envoyée au fournisseur avec succès.`
          : `Brouillon ${orderNumber} enregistré.`,
      type: "success",
    });

    // Reset form
    setNewItems([]);
    setNewOrderNotes("");
  };

  // Confirm order reception and update Dexie stock
  const handleConfirmReception = async () => {
    if (!orderToReceive) return;

    // Increment stocks in Dexie DB
    for (const item of orderToReceive.items) {
      // Find matching product by reference or name
      const existing = await db.products
        .where("reference")
        .equals(item.reference)
        .first();

      if (existing) {
        // Increment chosen stock
        if (receptionTargetLocation === "VITRINE") {
          await db.products.update(existing.id, {
            stockVitrine: (existing.stockVitrine || 0) + item.quantity,
          });
        } else {
          await db.products.update(existing.id, {
            stockCoffre: (existing.stockCoffre || 0) + item.quantity,
          });
        }
      } else {
        // Create new catalog product
        const estimatedMarkup = item.unitCostHT * 2.2;
        const priceTTC = Math.round(estimatedMarkup * 1.2);
        const newProduct: ProductItem = {
          id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          reference: item.reference,
          barcode: `200000${Math.floor(100000 + Math.random() * 900000)}`,
          name: item.name,
          category: item.category,
          priceTTC,
          vatRate: 0.2,
          stockVitrine: receptionTargetLocation === "VITRINE" ? item.quantity : 0,
          stockCoffre: receptionTargetLocation === "COFFRE" ? item.quantity : 0,
          metalType: item.metalType,
          goldCarats: item.goldCarats,
          weightGrams: item.weightGrams,
          diamond4C: item.diamond4C,
        };
        await db.products.add(newProduct);
      }
    }

    // Update order status
    await db.supplierOrders.update(orderToReceive.id, {
      status: "RECEPTIONNEE",
      receivedAt: new Date().toISOString(),
      targetStockLocation: receptionTargetLocation,
    });

    const receivedOrder = {
      ...orderToReceive,
      status: "RECEPTIONNEE" as const,
      receivedAt: new Date().toISOString(),
      targetStockLocation: receptionTargetLocation,
    };

    await loadOrdersAndProducts();
    setOrderToReceive(null);

    // Open Zebra batch print modal
    setZebraBatchOrder(receivedOrder);
    setNotification({
      message: `Commande ${orderToReceive.orderNumber} réceptionnée : stock incrémenté en ${
        receptionTargetLocation === "VITRINE" ? "Vitrine" : "Coffre-fort"
      }.`,
      type: "success",
    });
  };

  // Execute batch print on Zebra
  const handlePrintBatchZebra = async () => {
    if (!zebraBatchOrder) return;
    for (const item of zebraBatchOrder.items) {
      await printJewelryLabel({
        reference: item.reference,
        name: item.name,
        price: item.unitCostHT * 2.4, // indicative price TTC
        barcode: `200000${Math.floor(100000 + Math.random() * 900000)}`,
        metal: item.goldCarats ? `Or ${item.goldCarats}` : undefined,
      });
    }
    setNotification({
      message: `Lot de ${zebraBatchOrder.items.reduce(
        (sum, it) => sum + it.quantity,
        0
      )} étiquettes Zebra envoyé à l'imprimante ZD420.`,
      type: "success",
    });
    setZebraBatchOrder(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>Commandes Fournisseurs & Réceptions en Stock</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Réassort joaillerie, intégration immédiate en stock (Vitrine / Coffre-fort) & étiquetage Zebra par lot
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToStock && (
            <button
              onClick={onNavigateToStock}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200/90 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>Voir l'Inventaire Stock</span>
            </button>
          )}

          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Commande Fournisseur</span>
          </button>
        </div>
      </div>

      {/* 4 Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Commandes en cours
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {metrics.pendingCount}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">
              {metrics.totalPendingPieces} pièces attendues
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Valeur d'Achat Engagée HT
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
              {formatCurrency(metrics.pendingAmountHT)}
            </span>
            <span className="text-[10px] text-slate-500">
              Fournisseurs UE & Internationaux
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Commandes Réceptionnées
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {metrics.receivedCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              Stocks incrémentés & étiquetés
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Brouillons en préparation
            </span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">
              {metrics.draftCount}
            </span>
            <span className="text-[10px] text-slate-500">
              À valider avant transmission
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Toutes les commandes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-[10px] text-slate-800">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("COMMANDEE")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "COMMANDEE"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>En Acheminement</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px]">
              {metrics.pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("RECEPTIONNEE")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "RECEPTIONNEE"
                ? "bg-emerald-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Réceptionnées</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[10px]">
              {metrics.receivedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("BROUILLON")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "BROUILLON"
                ? "bg-slate-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Brouillons</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px]">
              {metrics.draftCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="N° commande, fournisseur, gemme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500">
            <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold">Aucune commande fournisseur trouvée</p>
            <p className="text-xs text-slate-400 mt-1">
              Modifiez vos filtres ou créez une nouvelle commande de réassort.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const totalItemsCount = order.items.reduce((s, it) => s + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center justify-center font-bold text-sm">
                      <Truck className="w-5 h-5 text-amber-700" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {order.orderNumber}
                        </span>

                        {/* Status Badge */}
                        {order.status === "COMMANDEE" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span>Commandée (En acheminement)</span>
                          </span>
                        )}
                        {order.status === "RECEPTIONNEE" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Réceptionnée & Stockée</span>
                          </span>
                        )}
                        {order.status === "BROUILLON" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Brouillon</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {order.supplierName}
                        </span>
                        {order.supplierCountry && (
                          <span className="text-[11px] text-slate-500">
                            • {order.supplierCountry}
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Émise le {formatDateOnly(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Total & Fast Action */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Montant Total HT
                      </span>
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatCurrency(order.totalHT)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        TTC : {formatCurrency(order.totalTTC)}
                      </span>
                    </div>

                    {/* Action buttons depending on status */}
                    {order.status === "COMMANDEE" && (
                      <button
                        onClick={() => {
                          setOrderToReceive(order);
                          setReceptionTargetLocation("VITRINE");
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
                      >
                        <Package className="w-4 h-4 text-amber-100" />
                        <span>Réceptionner le Stock</span>
                      </button>
                    )}

                    {order.status === "RECEPTIONNEE" && (
                      <button
                        onClick={() => setZebraBatchOrder(order)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-300 flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <Printer className="w-4 h-4 text-emerald-700" />
                        <span>Étiquettes Zebra ({totalItemsCount})</span>
                      </button>
                    )}

                    {order.status === "BROUILLON" && (
                      <button
                        onClick={async () => {
                          await db.supplierOrders.update(order.id, {
                            status: "COMMANDEE",
                            orderedAt: new Date().toISOString(),
                          });
                          await loadOrdersAndProducts();
                          setNotification({
                            message: `Commande ${order.orderNumber} passée avec succès.`,
                            type: "success",
                          });
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Passer Commande</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Preview Table */}
                <div className="p-4 bg-slate-50/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 font-semibold border-b border-slate-200 pb-2">
                          <th className="pb-2 font-medium">Référence & Description</th>
                          <th className="pb-2 font-medium">Catégorie / Détails</th>
                          <th className="pb-2 font-medium text-center">Quantité</th>
                          <th className="pb-2 font-medium text-right">P.U. Achat HT</th>
                          <th className="pb-2 font-medium text-right">Total HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/80">
                            <td className="py-2 pr-3">
                              <span className="font-mono text-slate-500 text-[11px] block">
                                {item.reference}
                              </span>
                              <span className="font-semibold text-slate-900">{item.name}</span>
                            </td>
                            <td className="py-2 pr-3 text-slate-600">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] font-semibold text-slate-700 mr-2">
                                {item.category}
                              </span>
                              {item.metalType && (
                                <span className="text-[11px] text-slate-500 mr-2">
                                  {item.metalType.replace("_", " ")} {item.goldCarats}
                                </span>
                              )}
                              {item.diamond4C && (
                                <span className="text-[10px] text-amber-800 font-mono">
                                  💎 {item.diamond4C.carat}ct {item.diamond4C.color}/
                                  {item.diamond4C.clarity}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-center font-mono font-bold text-slate-900">
                              {item.quantity}
                            </td>
                            <td className="py-2 text-right font-mono text-slate-600">
                              {formatCurrency(item.unitCostHT)}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(item.totalHT)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Footer & Notes */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-2">
                      {order.notes && (
                        <p className="italic text-slate-600 text-[11px]">
                          Note : {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {order.targetStockLocation && (
                        <span className="flex items-center gap-1 font-semibold text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          {order.targetStockLocation === "VITRINE" ? (
                            <>
                              <Store className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Affecté en Stock Vitrine</span>
                            </>
                          ) : (
                            <>
                              <Vault className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sécurisé au Coffre-fort</span>
                            </>
                          )}
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="text-amber-700 hover:text-amber-800 font-semibold text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Détails & Traçabilité</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Reception de Commande (Affectation Vitrine vs Coffre-fort) */}
      <Modal
        isOpen={Boolean(orderToReceive)}
        onClose={() => setOrderToReceive(null)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <Package className="w-5 h-5 text-amber-600" />
            <span>Réception de Stock • {orderToReceive?.orderNumber}</span>
          </div>
        }
        description="Confirmez l'entrée en stock physique des bijoux et choisissez l'emplacement de destination"
        maxWidth="2xl"
      >
        {orderToReceive && (
          <div className="space-y-5 text-xs text-slate-900">
            {/* Supplier recap */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">
                  {orderToReceive.supplierName}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {orderToReceive.supplierCountry} • {orderToReceive.items.length} référence(s)
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Total Achat HT</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(orderToReceive.totalHT)}
                </span>
              </div>
            </div>

            {/* Target Location Selector (Vitrine vs Coffre-fort) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Emplacement de stockage des pièces entrantes :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setReceptionTargetLocation("VITRINE")}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    receptionTargetLocation === "VITRINE"
                      ? "border-amber-600 bg-amber-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      receptionTargetLocation === "VITRINE"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Stock Vitrine (Magasin)</span>
                      {receptionTargetLocation === "VITRINE" && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Mise en rayon immédiate sur plateaux de vente pour les clients comptoir.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setReceptionTargetLocation("COFFRE")}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    receptionTargetLocation === "COFFRE"
                      ? "border-amber-600 bg-amber-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      receptionTargetLocation === "COFFRE"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Vault className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Stock Coffre-fort (Haute Sécurité)</span>
                      {receptionTargetLocation === "COFFRE" && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Pièces de grande valeur, diamants solitaires et métaux d'atelier sécurisés.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items summary */}
            <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-white max-h-48 overflow-y-auto">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block mb-1">
                Articles à réceptionner :
              </span>
              {orderToReceive.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs last:border-0"
                >
                  <div>
                    <span className="font-bold text-slate-900">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Ref: {item.reference}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-800">
                    +{item.quantity} unité(s)
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setOrderToReceive(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReception}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider la Réception & Incrémenter le Stock</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Impression en Lot Étiquettes Zebra */}
      <Modal
        isOpen={Boolean(zebraBatchOrder)}
        onClose={() => setZebraBatchOrder(null)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <Printer className="w-5 h-5 text-amber-600" />
            <span>Impression en Lot Zebra • {zebraBatchOrder?.orderNumber}</span>
          </div>
        }
        description="Impression d'étiquettes bijouterie haltère rat-tail (38x13mm) pour les pièces réceptionnées"
        maxWidth="lg"
      >
        {zebraBatchOrder && (
          <div className="space-y-4 text-xs text-slate-900">
            {/* Visual preview of label */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Aperçu format Étiquette Haltère Rat-tail (ZPL II)
              </span>

              <div className="bg-white border-2 border-slate-400 rounded-lg p-3 w-64 shadow-md font-mono text-[10px] space-y-1">
                <div className="flex justify-between font-bold text-slate-900 border-b border-dashed border-slate-300 pb-1">
                  <span className="truncate max-w-[140px]">
                    {zebraBatchOrder.items[0]?.name}
                  </span>
                  <span className="text-amber-800 font-bold">Or 18K</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-0.5">
                  <span>Ref: {zebraBatchOrder.items[0]?.reference}</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {formatCurrency(zebraBatchOrder.items[0]?.unitCostHT * 2.2 || 950)}
                  </span>
                </div>
                {/* Simulated barcode */}
                <div className="flex items-center justify-center py-1">
                  <div className="h-6 w-44 bg-slate-900 flex items-center justify-center text-white text-[8px] font-mono tracking-widest">
                    ||| | |||| | ||| || |||
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block">
                Total étiquettes à imprimer :{" "}
                <span className="text-amber-800 font-black">
                  {zebraBatchOrder.items.reduce((s, it) => s + it.quantity, 0)} étiquette(s)
                </span>
              </span>
              <p className="text-[11px] text-slate-500">
                Imprimante cible : Zebra ZD420 (Thermique direct 203 DPI, port USB/Série)
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setZebraBatchOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Plus tard
              </button>
              <button
                onClick={handlePrintBatchZebra}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Lancer l'Impression Zebra</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Nouvelle Commande Fournisseur */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <PlusCircle className="w-5 h-5 text-amber-600" />
            <span>Créer une Commande Fournisseur (Réassort)</span>
          </div>
        }
        description="Remplissez les informations fournisseur et ajoutez les bijoux, pierres ou montures à commander"
        maxWidth="3xl"
      >
        <div className="space-y-5 text-xs text-slate-900">
          {/* Supplier Preset Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Sélectionner un Fournisseur Partenaire
              </label>
              <select
                value={newSupplierName}
                onChange={(e) => handleSelectPresetSupplier(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
              >
                {PRESET_SUPPLIERS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Contact & Pays d'expédition
              </label>
              <input
                type="text"
                value={`${newSupplierContact} • ${newSupplierCountry}`}
                onChange={(e) => setNewSupplierContact(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden text-slate-800"
              />
            </div>
          </div>

          {/* Add Item form */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Ajouter une Référence Bijou / Gemme à la Commande</span>
            </span>

            {/* Fast catalog picker */}
            {catalogProducts.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-400 font-semibold whitespace-nowrap">
                  Réassort rapide :
                </span>
                {catalogProducts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setItemInputRef(p.reference);
                      setItemInputName(p.name);
                      setItemInputCategory(p.category);
                      setItemInputCostHT(Math.round(p.priceTTC / 2.4));
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 text-left whitespace-nowrap transition-colors"
                  >
                    + {p.name.substring(0, 24)}...
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-600 block mb-0.5">Désignation</label>
                <input
                  type="text"
                  placeholder="Ex: Corps de bague or 18k..."
                  value={itemInputName}
                  onChange={(e) => setItemInputName(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Référence</label>
                <input
                  type="text"
                  placeholder="REF-..."
                  value={itemInputRef}
                  onChange={(e) => setItemInputRef(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Catégorie</label>
                <select
                  value={itemInputCategory}
                  onChange={(e) => setItemInputCategory(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="bague">Bague</option>
                  <option value="collier">Collier</option>
                  <option value="bracelet">Bracelet</option>
                  <option value="boucles">Boucles</option>
                  <option value="montre">Montre</option>
                  <option value="matiere">Gemme / Métal</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={itemInputQty}
                  onChange={(e) => setItemInputQty(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono text-center"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">P.U. HT (€)</label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={itemInputCostHT}
                  onChange={(e) => setItemInputCostHT(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono text-right"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddItemToOrder}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Ajouter à la liste</span>
              </button>
            </div>
          </div>

          {/* Current order items list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-2.5 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center text-xs">
              <span>Articles commandés ({newItems.length})</span>
              <span className="font-mono text-slate-900">
                Total HT :{" "}
                {formatCurrency(newItems.reduce((sum, it) => sum + it.totalHT, 0))}
              </span>
            </div>

            <div className="p-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {newItems.length === 0 ? (
                <div className="text-center py-4 text-slate-400 italic">
                  Aucun article ajouté pour le moment.
                </div>
              ) : (
                newItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Ref: {item.reference} • Qté: {item.quantity} x {formatCurrency(item.unitCostHT)} HT
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalHT)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order notes */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Instructions logistiques / Notes de commande
            </label>
            <input
              type="text"
              placeholder="Ex: Livraison sous scellé diplomatique, affinage certifié..."
              value={newOrderNotes}
              onChange={(e) => setNewOrderNotes(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => setIsNewOrderModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => handleSaveOrder("BROUILLON")}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs transition-colors"
            >
              Enregistrer Brouillon
            </button>
            <button
              onClick={() => handleSaveOrder("COMMANDEE")}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Valider & Passer Commande</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Order Details */}
      <Modal
        isOpen={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-amber-600" />
            <span>Fiche Commande Fournisseur • {selectedOrderDetails?.orderNumber}</span>
          </div>
        }
        description="Traçabilité complète des références, conditions fiscales et historique d'acheminement"
        maxWidth="xl"
      >
        {selectedOrderDetails && (
          <div className="space-y-4 text-xs text-slate-900">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Fournisseur :</span>
                <span className="font-bold">{selectedOrderDetails.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact & Téléphone :</span>
                <span>{selectedOrderDetails.supplierContact || "Non spécifié"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date de création :</span>
                <span className="font-mono">{formatDateOnly(selectedOrderDetails.createdAt)}</span>
              </div>
              {selectedOrderDetails.receivedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Date de réception effective :</span>
                  <span className="font-mono text-emerald-800 font-bold">
                    {formatDateOnly(selectedOrderDetails.receivedAt)}
                  </span>
                </div>
              )}
              {selectedOrderDetails.targetStockLocation && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Affectation du stock :</span>
                  <span className="font-bold text-amber-800">
                    {selectedOrderDetails.targetStockLocation === "VITRINE"
                      ? "Stock Vitrine"
                      : "Stock Coffre-fort"}
                  </span>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden p-3 bg-white space-y-2">
              <span className="font-bold text-slate-800 block">Détail financier :</span>
              <div className="flex justify-between">
                <span className="text-slate-500">Total HT :</span>
                <span className="font-mono font-bold">
                  {formatCurrency(selectedOrderDetails.totalHT)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TVA applicable :</span>
                <span className="font-mono">
                  {selectedOrderDetails.totalVAT === 0
                    ? "0,00 € (Autoliquidation intra-UE art. 283-2 CGI)"
                    : formatCurrency(selectedOrderDetails.totalVAT)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1 font-bold text-sm">
                <span>Total TTC :</span>
                <span className="text-amber-800 font-mono">
                  {formatCurrency(selectedOrderDetails.totalTTC)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SupplierOrdersScreen;
