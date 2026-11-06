import { Diamond, Sparkles, Send, ShoppingBag } from "lucide-react";
import { type ProductItem } from "../../db/db";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatWeight } from "@erp-bijoux/shared-ui";

interface JewelryDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductItem) => void;
  onTransferToCounterPos: (product: ProductItem) => void;
}

export function JewelryDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onTransferToCounterPos,
}: JewelryDetailModalProps) {
  if (!product) return null;

  // Real-time gold value estimation (18k = ~58€/g pure value based on current gold fixing ~78€/g)
  const estimatedMeltValue = product.weightGrams
    ? product.weightGrams * (product.goldCarats === "18k" ? 58.5 : 30.0)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span>Fiche Bijou Instantanée</span>
        </div>
      }
      description={`Référence : ${product.reference} • Code-barres : ${product.barcode}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Main product presentation */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {product.imageUrl && (
            <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 shadow-xs">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(product.priceTTC)}
              </span>
              <span className="text-xs text-slate-500">TTC (TVA {(product.vatRate * 100).toFixed(0)}%)</span>
            </div>

            {/* Showcase vs Safe Stocks */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Stock Vitrine</span>
                <span
                  className={`text-lg font-black font-mono ${
                    product.stockVitrine > 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {product.stockVitrine} ex.
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Stock Coffre</span>
                <span className="text-lg font-black font-mono text-slate-800">
                  {product.stockCoffre} ex.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Joaillerie Specifications */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Diamond className="w-4 h-4 text-amber-600" />
            <span>Caractéristiques Joaillerie & Métaux</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {product.metalType && (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Métal</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {product.metalType.replace("_", " ")}
                </span>
              </div>
            )}

            {product.goldCarats && (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Titre Or</span>
                <span className="font-semibold text-amber-800">{product.goldCarats.toUpperCase()} (750‰)</span>
              </div>
            )}

            {product.weightGrams && (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Poids Brut</span>
                <span className="font-semibold text-slate-900 font-mono">{formatWeight(product.weightGrams)}</span>
              </div>
            )}

            {product.fingerSize && (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Tour de doigt</span>
                <span className="font-bold text-amber-800 text-sm font-mono">Taille {product.fingerSize}</span>
              </div>
            )}
          </div>

          {/* Diamond 4Cs certificate if diamond */}
          {product.diamond4C && (
            <div className="mt-3 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                <Diamond className="w-3.5 h-3.5 text-amber-600" />
                Certificat Diamant - Les 4C
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white py-1.5 px-2 rounded-lg border border-amber-200 shadow-xs">
                  <span className="text-[10px] text-slate-400 block">CARAT</span>
                  <span className="font-bold text-slate-900 font-mono">{product.diamond4C.carat} ct</span>
                </div>
                <div className="bg-white py-1.5 px-2 rounded-lg border border-amber-200 shadow-xs">
                  <span className="text-[10px] text-slate-400 block">COLOR</span>
                  <span className="font-bold text-slate-900">{product.diamond4C.color}</span>
                </div>
                <div className="bg-white py-1.5 px-2 rounded-lg border border-amber-200 shadow-xs">
                  <span className="text-[10px] text-slate-400 block">CLARITY</span>
                  <span className="font-bold text-slate-900">{product.diamond4C.clarity}</span>
                </div>
                <div className="bg-white py-1.5 px-2 rounded-lg border border-amber-200 shadow-xs">
                  <span className="text-[10px] text-slate-400 block">CUT</span>
                  <span className="font-bold text-slate-900">{product.diamond4C.cut}</span>
                </div>
              </div>
            </div>
          )}

          {estimatedMeltValue && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Cours or estimé au gramme :</span>
              <span className="text-amber-800 font-mono font-bold">
                ~{formatCurrency(estimatedMeltValue)} (valeur matière)
              </span>
            </div>
          )}
        </div>

        {/* Dual Actions: Add to seller cart vs Instant transfer to counter POS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-200 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>Ajouter au Panier</span>
          </button>

          <button
            onClick={() => {
              onTransferToCounterPos(product);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Transférer à la Caisse Comptoir</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
