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
import { db, type ProductItem, type CustomerRecord } from "../../db/db";
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
  const [customersList, setCustomersList] = useState<CustomerRecord[]>([]);
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

  // Load products and customers from Dexie
  const loadData = async () => {
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
    const allCust = await db.customers.toArray();
    setCustomersList(allCust);
  };

  useEffect(() => {
    loadData();
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
    setTransferNotification("Panier synchronisé avec la Caisse Comptoir ! Encaissement prêt.");
    setTimeout(() => setTransferNotification(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 text-slate-900">
      {/* Transfer Alert Banner */}
      {transferNotification && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{transferNotification}</span>
        </div>
      )}

      {/* Main Dual-Layout: Desktop vs Mobile */}
      {deviceMode === "DESKTOP_POS" ? (
        /* ================= DESKTOP PC DE CAISSE (15-24 POUCES) ================= */
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column (Cols 1-7): Catalog & Quick Services */}
          <div className="col-span-7 flex flex-col border-r border-slate-200/90 bg-slate-50/70 p-4 gap-4 overflow-hidden">
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
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-xs transition-colors"
                />
              </div>

              <button
                onClick={() => setIsCameraScannerOpen(true)}
                title="Scanner caméra"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Caméra</span>
              </button>

              <button
                onClick={() => setIsZReportOpen(true)}
                title="Rapport Z Clôture journalière"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Rapport Z</span>
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
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
                    className="bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl p-3 flex flex-col justify-between cursor-pointer group transition-all duration-150 active:scale-[0.98] shadow-xs hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono text-[10px]">{product.reference}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            product.stockVitrine > 0
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                              : "bg-amber-50 text-amber-900 border border-amber-200/80"
                          }`}
                        >
                          {product.isQuickService ? "Service" : `Vitrine: ${product.stockVitrine}`}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-700 line-clamp-2 transition-colors">
                        {product.name}
                      </h4>

                      {product.goldCarats && (
                        <div className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                          <span>Or {product.goldCarats}</span>
                          {product.weightGrams && <span>• {formatWeight(product.weightGrams)}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                      <span className="font-black text-sm text-slate-900 font-mono">
                        {formatCurrency(product.priceTTC)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForModal(product);
                        }}
                        className="text-[10px] text-slate-500 hover:text-amber-700 font-medium underline"
                      >
                        Fiche
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast services quick-access bar (Piles, Perçage, Mise à taille) */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 flex items-center gap-2 overflow-x-auto shadow-xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap pl-1">
                Services Express :
              </span>
              {products
                .filter((p) => p.isQuickService)
                .map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => addToCart(srv)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 whitespace-nowrap flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>{srv.name.split("+")[0].trim()}</span>
                    <span className="text-amber-800 font-mono text-[11px] font-bold">
                      {formatCurrency(srv.priceTTC)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Right Column (Cols 8-12): Cart, Customer & Checkout */}
          <div className="col-span-5 flex flex-col bg-white border-l border-slate-200/90 p-4 gap-4 overflow-hidden">
            {/* Customer selector (F2) */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {customer ? customer.name : "Client de Passage"}
                  </span>
                  <span className="text-[10px] text-slate-400">Raccourci F2 pour sélectionner</span>
                </div>
              </div>

              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
              >
                {customer ? "Modifier (F2)" : "+ Client (F2)"}
              </button>
            </div>

            {/* Cart Items Table */}
            <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>Panier en cours ({cart.reduce((sum, i) => sum + i.quantity, 0)} articles)</span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-slate-400 hover:text-rose-600 text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vider</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">Le panier est vide</p>
                    <p className="text-[11px] text-slate-400">Scannez un code-barres ou sélectionnez un bijou</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{item.name}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {item.reference}</span>
                          {item.customNotes && (
                            <p className="text-[10px] text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded-md border border-amber-200 mt-1 font-medium leading-relaxed">
                              {item.customNotes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-black text-slate-900 font-mono whitespace-nowrap">
                          {formatCurrency(item.totalTTC)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
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
                                ? "bg-amber-50 border-amber-300 text-amber-900"
                                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
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
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Sous-total HT :</span>
                  <span className="font-mono font-medium text-slate-700">{formatCurrency(subtotalHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA collectée (20%) :</span>
                  <span className="font-mono font-medium text-slate-700">{formatCurrency(totalVAT)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>TOTAL TTC :</span>
                  <span className="text-xl font-mono text-amber-700">{formatCurrency(totalTTC)}</span>
                </div>
              </div>

              {/* Big Checkout Touch Button (F12) */}
              <button
                disabled={cart.length === 0}
                onClick={openPaymentModal}
                className="w-full h-15 bg-gradient-to-r from-amber-600 via-amber-600 to-yellow-600 hover:brightness-105 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none text-white font-black text-base rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all"
              >
                <CreditCard className="w-5 h-5 text-white" />
                <span>ENCAISSER (F12)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SMARTPHONE VENDEUSE NOMADE ================= */
        <div className="flex-1 flex flex-col p-3 overflow-hidden max-w-md mx-auto w-full">
          {/* Mobile Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-900">Vendeuse Nomade</span>
              <span className="text-[11px] text-amber-700 block font-medium">{currentSeller.name}</span>
            </div>

            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs active:scale-95"
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
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Mobile Showcase Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-24 pr-1">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProductForModal(p)}
                className="bg-white p-3 rounded-2xl border border-slate-200 flex gap-3 items-center active:bg-slate-50 cursor-pointer shadow-xs"
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Ref: {p.reference}</span>
                    {p.fingerSize && <span className="text-amber-700 font-bold">T.{p.fingerSize}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-slate-900 text-xs font-mono">{formatCurrency(p.priceTTC)}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        p.stockVitrine > 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                      }`}
                    >
                      Vitrine: {p.stockVitrine}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Bottom Action Drawer for 1-Handed Mobile Use */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 border-t border-slate-200 backdrop-blur-md flex items-center justify-between gap-3 z-20 shadow-lg">
            <button
              onClick={() => setMobileCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 border border-slate-200"
            >
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Panier ({cart.length})</span>
            </button>

            <button
              disabled={cart.length === 0}
              onClick={() => handleTransferToCounter()}
              className="flex-1 py-2.5 px-4 bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>Transférer Caisse ({formatCurrency(totalTTC)})</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Modal (F2) connected to Dexie Customers */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Sélectionner Fiche Client Joaillerie"
        description="Associer la vente à un client fidèle pour créditer son historique ou utiliser un avoir"
      >
        <div className="space-y-3">
          {customersList.map((cust) => (
            <div
              key={cust.id}
              onClick={() => {
                setCustomer({
                  id: cust.id,
                  name: `${cust.firstName} ${cust.lastName}`,
                  phone: cust.phone,
                  email: cust.email,
                  hasVoucher: cust.voucherAmount > 0,
                  voucherAmount: cust.voucherAmount,
                });
                setIsCustomerModalOpen(false);
              }}
              className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-xs"
            >
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {cust.firstName} {cust.lastName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{cust.phone}</span>
                {cust.fingerSizes.length > 0 && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {cust.fingerSizes.length} taille(s) au baguier
                  </span>
                )}
              </div>
              <div className="text-right">
                {cust.voucherAmount > 0 && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    Avoir : {formatCurrency(cust.voucherAmount)}
                  </span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setCustomer(null);
              setIsCustomerModalOpen(false);
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
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
                className="py-3 bg-slate-50 hover:bg-amber-600 hover:text-white border border-slate-200 text-slate-900 font-bold rounded-xl text-sm transition-colors shadow-xs"
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
            className="w-full py-2 bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-xl border border-slate-200"
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
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{item.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {item.quantity}x @ {formatCurrency(item.unitPriceTTC)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-700 font-mono">{formatCurrency(item.totalTTC)}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-rose-600">
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
            className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
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
