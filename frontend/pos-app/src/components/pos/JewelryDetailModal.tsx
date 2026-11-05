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
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
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
            <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0 shadow-md">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-bold text-slate-100">{product.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">
                {formatCurrency(product.priceTTC)}
              </span>
              <span className="text-xs text-slate-400">TTC (TVA {(product.vatRate * 100).toFixed(0)}%)</span>
            </div>

            {/* Showcase vs Safe Stocks */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Stock Vitrine</span>
                <span
                  className={`text-lg font-black ${
                    product.stockVitrine > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {product.stockVitrine} ex.
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Stock Coffre</span>
                <span className="text-lg font-black text-sky-400">
                  {product.stockCoffre} ex.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Joaillerie Specifications */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Diamond className="w-4 h-4 text-amber-400" />
            Caractéristiques Joaillerie & Métaux
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {product.metalType && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Métal</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {product.metalType.replace("_", " ")}
                </span>
              </div>
            )}

            {product.goldCarats && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Titre Or</span>
                <span className="font-semibold text-amber-400">{product.goldCarats.toUpperCase()} (750‰)</span>
              </div>
            )}

            {product.weightGrams && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Poids Brut</span>
                <span className="font-semibold text-slate-200">{formatWeight(product.weightGrams)}</span>
              </div>
            )}

            {product.fingerSize && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Tour de doigt</span>
                <span className="font-bold text-amber-400 text-sm">Taille {product.fingerSize}</span>
              </div>
            )}
          </div>

          {/* Diamond 4Cs certificate if diamond */}
          {product.diamond4C && (
            <div className="mt-3 bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-sky-950/40 p-3 rounded-xl border border-sky-800/40">
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5 mb-2">
                <Diamond className="w-3.5 h-3.5 text-sky-400" />
                Certificat Diamant - Les 4C
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">CARAT</span>
                  <span className="font-bold text-slate-100">{product.diamond4C.carat} ct</span>
                </div>
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">COLOR</span>
                  <span className="font-bold text-slate-100">{product.diamond4C.color}</span>
                </div>
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">CLARITY</span>
                  <span className="font-bold text-slate-100">{product.diamond4C.clarity}</span>
                </div>
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">CUT</span>
                  <span className="font-bold text-slate-100">{product.diamond4C.cut}</span>
                </div>
              </div>
            </div>
          )}

          {estimatedMeltValue && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Cours or estimé au gramme :</span>
              <span className="text-amber-400 font-mono font-medium">
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
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Ajouter au Panier</span>
          </button>

          <button
            onClick={() => {
              onTransferToCounterPos(product);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span>Transférer à la Caisse Comptoir</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
