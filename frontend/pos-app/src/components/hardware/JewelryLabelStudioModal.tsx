import { useState, useEffect } from "react";
import {
  Tag,
  Printer,
  RefreshCw,
  Save,
  CheckCircle2,
  FileCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { db, type ProductItem } from "../../db/db";
import { useHardwareStore } from "../../store/useHardwareStore";
import { useUserStore } from "../../store/useUserStore";
import { Modal, formatCurrency, formatWeight } from "@erp-bijoux/shared-ui";
import { BarcodeSvg } from "./BarcodeSvg";

interface JewelryLabelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: ProductItem | null;
}

export function JewelryLabelStudioModal({
  isOpen,
  onClose,
  initialProduct,
}: JewelryLabelStudioModalProps) {
  const { tenant } = useUserStore();
  const { printJewelryLabel } = useHardwareStore();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Editable label fields
  const [reference, setReference] = useState("");
  const [name, setName] = useState("");
  const [priceTTC, setPriceTTC] = useState(2890);
  const [barcode, setBarcode] = useState("200000000101");
  const [metalType, setMetalType] = useState("Or Jaune 18K (750‰)");
  const [weightGrams, setWeightGrams] = useState(3.42);
  const [stoneDetails, setStoneDetails] = useState("Diamant 0.50ct F/VS1");
  const [copies, setCopies] = useState(1);

  const [showZplCode, setShowZplCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load products from DB
  useEffect(() => {
    if (isOpen) {
      db.products.toArray().then((items) => {
        setProducts(items);
        if (initialProduct) {
          applyProduct(initialProduct);
        } else if (items.length > 0 && !selectedProductId) {
          applyProduct(items[0]);
        }
      });
    }
  }, [isOpen, initialProduct]);

  const applyProduct = (p: ProductItem) => {
    setSelectedProductId(p.id);
    setReference(p.reference);
    setName(p.name);
    setPriceTTC(p.priceTTC);
    setBarcode(p.barcode || "200000000101");
    setMetalType(p.metalType || "Or 750‰");
    setWeightGrams(p.weightGrams || 3.5);
    setStoneDetails(
      p.diamond4C
        ? `Diamant ${p.diamond4C.carat}ct ${p.diamond4C.color}/${p.diamond4C.clarity}`
        : p.category
    );
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const found = products.find((p) => p.id === id);
    if (found) {
      applyProduct(found);
    }
  };

  // Generate a valid EAN13 internal barcode (starting with 200 prefix)
  const generateNewBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const raw = `200${randomDigits}`.slice(0, 12);

    // Calculate EAN13 check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(raw[i]);
      sum += i % 2 === 0 ? d : d * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const generated = `${raw}${checkDigit}`;

    setBarcode(generated);
    setSuccessMessage(`Nouveau code-barres EAN13 généré : ${generated}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Save new barcode and details back to Dexie Product
  const handleSaveToStock = async () => {
    if (!selectedProductId) return;
    try {
      await db.products.update(selectedProductId, {
        barcode: barcode,
        reference: reference,
        priceTTC: priceTTC,
      });
      setSuccessMessage("Code-barres et informations enregistrés sur la pièce de stock !");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.warn("Could not update product in DB:", err);
    }
  };

  // Print execution
  const handlePrint = async () => {
    // 1. Send to hardware store / Zebra stream
    await printJewelryLabel({
      reference,
      name,
      price: priceTTC,
      barcode,
      metal: metalType,
    });

    // 2. Open print dialog
    window.print();

    setSuccessMessage(
      `Ordre d'impression envoyé (${copies} étiquette(s)) pour ${reference} !`
    );
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  if (!isOpen) return null;

  const generatedZpl = `^XA
^PW304^LL104
^FO15,12^A0N,18,18^FD${tenant?.name || "Maison Vendôme"}^FS
^FO15,32^A0N,14,14^FD${metalType}^FS
^FO15,48^A0N,14,14^FD${weightGrams.toFixed(2)}g - ${stoneDetails}^FS
^FO160,12^A0N,22,22^FD${priceTTC.toFixed(2)} EUR^FS
^FO160,36^A0N,14,14^FDRef: ${reference}^FS
^FO160,54^BY1,2,22^BCN,22,N,N,N^FD${barcode}^FS
^XZ`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-600" />
          <span>Studio d'Étiquetage Joaillerie & Codes-Barres</span>
        </div>
      }
      description="Format étiquette bijou papillon/haltère 38x13mm avec cordon • Compatible Zebra ZD420"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs text-slate-800">
        {/* Notification toast */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Product Selector Dropdown */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Sélectionner un bijou du stock pour étiquetage
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.reference} — {p.name} ({formatCurrency(p.priceTTC)}) [EAN: {p.barcode}]
              </option>
            ))}
          </select>
        </div>

        {/* Realistic Jewelry Barbell Label Preview */}
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Aperçu Réel de l'Étiquette Haltère Bijouterie (Taille Réelle 38 × 13 mm)
          </span>

          {/* Barbell Tag Shape */}
          <div className="relative bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex items-center gap-4 max-w-md w-full">
            {/* Left Wing : Maison & Metal details */}
            <div className="flex-1 space-y-1 text-left border-r border-dashed border-slate-200 pr-3">
              <div className="font-black text-[11px] tracking-wide text-slate-900 uppercase">
                {tenant?.name || "Vendôme"}
              </div>
              <div className="text-[9px] font-semibold text-amber-800">
                {metalType}
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                {formatWeight(weightGrams)}
              </div>
              <div className="text-[8px] text-slate-400 truncate max-w-[120px]">
                {stoneDetails}
              </div>
            </div>

            {/* Central string connection (rat-tail cord) */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <div className="w-0.5 h-8 bg-amber-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Right Wing : Price, Reference & Vector Barcode */}
            <div className="flex-1 flex flex-col items-center justify-center pl-2 space-y-1">
              <div className="text-right w-full flex items-baseline justify-between">
                <span className="font-mono text-[9px] font-bold text-slate-700">
                  {reference}
                </span>
                <span className="font-mono text-xs font-black text-amber-700">
                  {formatCurrency(priceTTC)}
                </span>
              </div>

              {/* Dynamic SVG Barcode */}
              <div className="pt-0.5 bg-white">
                <BarcodeSvg value={barcode} width={130} height={32} showText={true} />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            Adhésif sans résidu joaillier spécialement conçu pour ne pas marquer les métaux précieux et diamants.
          </p>
        </div>

        {/* Barcode & Product Customization Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Barcode Input & Generator */}
          <div className="col-span-full bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>Code-barres Bijou (EAN13 / Code 128)</span>
              </label>
              <button
                type="button"
                onClick={generateNewBarcode}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                title="Générer un code-barres unique conforme"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Générer EAN13 Aléatoire</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.replace(/[^0-9A-Z-]/gi, ""))}
                placeholder="200000000101"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveToStock}
                disabled={!selectedProductId}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                title="Enregistrer ce code-barres sur le bijou dans la base de données"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-900/80">
              Vous pouvez modifier manuellement ce code-barres ou en générer un nouveau. Cliquez sur <strong>Enregistrer</strong> pour mettre à jour la pièce dans l'inventaire.
            </p>
          </div>

          {/* Reference */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Référence Pièce
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Prix TTC */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Prix de Vente TTC (€)
            </label>
            <input
              type="number"
              value={priceTTC}
              onChange={(e) => setPriceTTC(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Metal */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Titre Métal
            </label>
            <input
              type="text"
              value={metalType}
              onChange={(e) => setMetalType(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Copies */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nombre d'étiquettes à imprimer
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Collapsible ZPL Code Technical View */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowZplCode(!showZplCode)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Trame technique Zebra ZPL II (imprimante thermique)</span>
            {showZplCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showZplCode && (
            <div className="mt-2 space-y-1">
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-28 border border-slate-800">
                {generatedZpl}
              </pre>
              <p className="text-[10px] text-slate-400">
                Trame transmise automatiquement au port 9100 / USB lors de la commande d'impression.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-amber-200" />
            <span>Imprimer {copies > 1 ? `${copies} Étiquettes` : "l'Étiquette"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
