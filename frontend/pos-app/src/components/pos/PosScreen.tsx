import { useState, useEffect, useRef } from "react";
import {
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  Percent,
  User,
  CreditCard,
  FileText,
  Printer,
  Sparkles,
  Send,
  ShoppingBag,
} from "lucide-react";
import { db, type ProductItem } from "../../db/db";
import { usePosStore } from "../../store/usePosStore";
import { useHardwareStore } from "../../store/useHardwareStore";
import { useUserStore } from "../../store/useUserStore";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { usePosShortcuts } from "../../hooks/usePosShortcuts";
import { MobileCameraScanner } from "./MobileCameraScanner";
import { JewelryDetailModal } from "./JewelryDetailModal";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { ZReportModal } from "./ZReportModal";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatWeight } from "@erp-bijoux/shared-ui";

export function PosScreen() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateDiscount,
    clearCart,
    customer,
    setCustomer,
    openPaymentModal,
    getTotalTTC,
    getSubtotalHT,
    getTotalVAT,
  } = usePosStore();

  const { openCashDrawer, tareScale, printJewelryLabel } = useHardwareStore();
  const { deviceMode, currentSeller } = useUserStore();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductItem | null>(null);
  const [discountModalItem, setDiscountModalItem] = useState<{ id: string; name: string; current: number } | null>(null);
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false);
  const [transferNotification, setTransferNotification] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Load products from Dexie
  const loadProducts = async () => {
    const all = await db.products.toArray();
    setProducts(all);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Barcode lookup helper
  const handleBarcodeScanned = async (barcode: string) => {
    const item = await db.products.where("barcode").equals(barcode).first();
    if (item) {
      if (deviceMode === "MOBILE_VENDEUSE") {
        setSelectedProductForModal(item);
      } else {
        addToCart(item);
      }
    } else {
      // Try search query fallback
      setSearchQuery(barcode);
    }
  };

  // Global USB HID Barcode Scanner Interceptor (<35ms keystroke interval)
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
  });

  // Global POS Keyboard Shortcuts
  usePosShortcuts({
    onSearchFocus: () => searchInputRef.current?.focus(),
    onCustomerOpen: () => setIsCustomerModalOpen(true),
    onScaleTare: () => tareScale(),
    onOpenDrawer: () => openCashDrawer(),
    onCheckout: () => {
      if (cart.length > 0) openPaymentModal();
    },
    onEscape: () => {
      setSelectedProductForModal(null);
      setIsCameraScannerOpen(false);
    },
  });

  // Filtered catalog
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all"
        ? true
        : selectedCategory === "services"
        ? p.isQuickService
        : p.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q) ||
      p.barcode.includes(q);

    return matchesCategory && matchesSearch;
  });

  const totalTTC = getTotalTTC();
  const subtotalHT = getSubtotalHT();
  const totalVAT = getTotalVAT();

  // Transfer mobile draft to counter POS
  const handleTransferToCounter = (product?: ProductItem) => {
    if (product) {
      addToCart(product);
    }
    setTransferNotification("Panier transféré au PC Caisse Comptoir ! Encaissement TPE prêt.");
    setTimeout(() => setTransferNotification(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Transfer Alert Banner */}
      {transferNotification && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Sparkles className="w-4 h-4" />
          <span>{transferNotification}</span>
        </div>
      )}

      {/* Main Dual-Layout: Desktop vs Mobile */}
      {deviceMode === "DESKTOP_POS" ? (
        /* ================= DESKTOP PC DE CAISSE (15-24 POUCES) ================= */
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column (Cols 1-7): Catalog & Quick Services & Touch Numpad */}
          <div className="col-span-7 flex flex-col border-r border-slate-800/80 bg-slate-900/40 p-4 gap-4 overflow-hidden">
            {/* Search Bar + Barcode Scanner Trigger + Z-Report */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Recherche article, référence ou scan code-barres (F1)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                onClick={() => setIsCameraScannerOpen(true)}
                title="Scanner caméra"
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Caméra</span>
              </button>

              <button
                onClick={() => setIsZReportOpen(true)}
                title="Rapport Z Clôture journalière"
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Rapport Z</span>
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "Tous" },
                { id: "services", label: "⚡ Services Rapides" },
                { id: "bague", label: "Bagues" },
                { id: "collier", label: "Colliers" },
                { id: "bracelet", label: "Bracelets" },
                { id: "boucles", label: "Boucles" },
                { id: "montre", label: "Horlogerie" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === tab.id
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-slate-900 border border-slate-800/80 hover:border-amber-500/60 rounded-2xl p-3 flex flex-col justify-between cursor-pointer group transition-all duration-150 active:scale-[0.98] shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">{product.reference}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            product.stockVitrine > 0
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                              : "bg-amber-950 text-amber-400"
                          }`}
                        >
                          {product.isQuickService ? "Service" : `Vitrine: ${product.stockVitrine}`}
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-slate-100 group-hover:text-amber-400 line-clamp-2 transition-colors">
                        {product.name}
                      </h4>

                      {product.goldCarats && (
                        <div className="text-[10px] text-amber-400/90 font-medium">
                          Or {product.goldCarats} • {formatWeight(product.weightGrams || 0)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60">
                      <span className="font-black text-sm text-slate-100">
                        {formatCurrency(product.priceTTC)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForModal(product);
                        }}
                        className="text-[10px] text-slate-400 hover:text-amber-300 underline"
                      >
                        Fiche
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast services quick-access bar (Piles, Perçage, Mise à taille) */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider whitespace-nowrap pl-1">
                Raccourcis Services :
              </span>
              {products
                .filter((p) => p.isQuickService)
                .map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => addToCart(srv)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 whitespace-nowrap flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>{srv.name.split("+")[0].trim()}</span>
                    <span className="text-amber-400 font-mono text-[11px]">{formatCurrency(srv.priceTTC)}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Right Column (Cols 8-12): Cart, Customer & Checkout */}
          <div className="col-span-5 flex flex-col bg-slate-950 p-4 gap-4 overflow-hidden">
            {/* Customer selector (F2) */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">
                    {customer ? customer.name : "Client de Passage"}
                  </span>
                  <span className="text-[10px] text-slate-400">Raccourci F2 pour sélectionner</span>
                </div>
              </div>

              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
              >
                {customer ? "Modifier (F2)" : "+ Client (F2)"}
              </button>
            </div>

            {/* Cart Items Table */}
            <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800/80 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Panier en cours ({cart.reduce((sum, i) => sum + i.quantity, 0)} articles)</span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-slate-500 hover:text-rose-400 text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vider</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                    <ShoppingBag className="w-10 h-10 stroke-1 text-slate-600" />
                    <p className="text-xs">Le panier est vide</p>
                    <p className="text-[11px] text-slate-600">Scannez un code-barres ou sélectionnez un bijou</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 flex flex-col gap-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-100">{item.name}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {item.reference}</span>
                        </div>
                        <span className="text-xs font-black text-amber-400 whitespace-nowrap">
                          {formatCurrency(item.totalTTC)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remise & Zebra Print buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setDiscountModalItem({
                                id: item.productId,
                                name: item.name,
                                current: item.discountPercent,
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                              item.discountPercent > 0
                                ? "bg-amber-950 border-amber-700 text-amber-300"
                                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <Percent className="w-2.5 h-2.5 inline mr-0.5" />
                            {item.discountPercent > 0 ? `-${item.discountPercent}%` : "Remise"}
                          </button>

                          <button
                            onClick={() =>
                              printJewelryLabel({
                                reference: item.reference,
                                name: item.name,
                                price: item.unitPriceTTC,
                                barcode: "200000000101",
                              })
                            }
                            title="Imprimer étiquette Zebra ZPL"
                            className="p-1 text-slate-500 hover:text-amber-400"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals & Encaissement (F12) */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Sous-total HT :</span>
                  <span className="font-mono text-slate-300">{formatCurrency(subtotalHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA collectée (20%) :</span>
                  <span className="font-mono text-slate-300">{formatCurrency(totalVAT)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-100 pt-2 border-t border-slate-800">
                  <span>TOTAL TTC :</span>
                  <span className="text-xl text-amber-400">{formatCurrency(totalTTC)}</span>
                </div>
              </div>

              {/* Big Checkout Touch Button (F12) */}
              <button
                disabled={cart.length === 0}
                onClick={openPaymentModal}
                className="w-full h-16 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-950/40 flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
              >
                <CreditCard className="w-6 h-6 text-slate-950" />
                <span>ENCAISSER (F12)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SMARTPHONE VENDEUSE NOMADE (PWA 1 MAIN) ================= */
        <div className="flex-1 flex flex-col p-3 overflow-hidden max-w-md mx-auto w-full">
          {/* Mobile Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200">Vendeuse Nomade</span>
              <span className="text-[11px] text-amber-400 block">{currentSeller.name}</span>
            </div>

            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Scanner Caméra</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="py-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Chercher bijou, taille, carats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Mobile Showcase Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pb-24 pr-1">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProductForModal(p)}
                className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex gap-3 items-center active:bg-slate-800 cursor-pointer shadow-sm"
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 bg-slate-950"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{p.name}</h4>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Ref: {p.reference}</span>
                    {p.fingerSize && <span className="text-amber-400 font-bold">T.{p.fingerSize}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-black text-amber-400 text-xs">{formatCurrency(p.priceTTC)}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        p.stockVitrine > 0 ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300"
                      }`}
                    >
                      Vitrine: {p.stockVitrine} • Coffre: {p.stockCoffre}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Bottom Action Drawer for 1-Handed Mobile Use */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex items-center justify-between gap-3 z-20">
            <button
              onClick={() => setMobileCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-100 border border-slate-700"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Panier ({cart.length})</span>
            </button>

            <button
              disabled={cart.length === 0}
              onClick={() => handleTransferToCounter()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>Transférer Caisse Comptoir ({formatCurrency(totalTTC)})</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Modal (F2) */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Sélectionner ou Créer Fiche Client"
        description="Associer la vente à un client fidèle ou renseigner un avoir"
      >
        <div className="space-y-3">
          {[
            { id: "c1", name: "Marie Dupont", phone: "06 12 34 56 78", voucher: 50 },
            { id: "c2", name: "Alexandre Leroy", phone: "07 98 76 54 32", voucher: 0 },
            { id: "c3", name: "Claire Moreau", phone: "06 44 55 66 77", voucher: 120 },
          ].map((cust) => (
            <div
              key={cust.id}
              onClick={() => {
                setCustomer({ id: cust.id, name: cust.name, phone: cust.phone, voucherAmount: cust.voucher });
                setIsCustomerModalOpen(false);
              }}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="font-bold text-slate-100 text-xs block">{cust.name}</span>
                <span className="text-[10px] text-slate-400">{cust.phone}</span>
              </div>
              {cust.voucher > 0 && (
                <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  Avoir dispo : {cust.voucher} €
                </span>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              setCustomer(null);
              setIsCustomerModalOpen(false);
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
          >
            Client de passage anonyme
          </button>
        </div>
      </Modal>

      {/* Discount modal */}
      <Modal
        isOpen={Boolean(discountModalItem)}
        onClose={() => setDiscountModalItem(null)}
        title="Appliquer Remise Commerciale"
        description={discountModalItem?.name}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  if (discountModalItem) {
                    updateDiscount(discountModalItem.id, pct);
                    setDiscountModalItem(null);
                  }
                }}
                className="py-3 bg-slate-950 hover:bg-amber-600 hover:text-white border border-slate-800 text-slate-100 font-bold rounded-xl text-sm transition-colors"
              >
                -{pct}%
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (discountModalItem) {
                updateDiscount(discountModalItem.id, 0);
                setDiscountModalItem(null);
              }
            }}
            className="w-full py-2 bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-xl"
          >
            Annuler toute remise (0%)
          </button>
        </div>
      </Modal>

      {/* Mobile Barcode Scanner Camera Modal */}
      <MobileCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Instant Jewelry Sheet Modal */}
      <JewelryDetailModal
        product={selectedProductForModal}
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={addToCart}
        onTransferToCounterPos={handleTransferToCounter}
      />

      {/* Multi-tender Payment Modal */}
      <PaymentModal />

      {/* On-screen Printable Thermal Receipt Modal */}
      <ReceiptModal />

      {/* Mobile Cart Drawer Modal */}
      <Modal
        isOpen={mobileCartDrawerOpen}
        onClose={() => setMobileCartDrawerOpen(false)}
        title="Panier Vendeuse Nomade"
        description={`${cart.length} article(s) • Total : ${formatCurrency(totalTTC)}`}
      >
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-100 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {item.quantity}x @ {formatCurrency(item.unitPriceTTC)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{formatCurrency(item.totalTTC)}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setMobileCartDrawerOpen(false);
              handleTransferToCounter();
            }}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Transférer à la Caisse Comptoir</span>
          </button>
        </div>
      </Modal>

      {/* Z-Report Fiscal Closing Modal */}
      <ZReportModal isOpen={isZReportOpen} onClose={() => setIsZReportOpen(false)} />
    </div>
  );
}
