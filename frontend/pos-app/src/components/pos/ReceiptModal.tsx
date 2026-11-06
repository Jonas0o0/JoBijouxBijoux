import { Printer, PlusCircle, CheckCircle } from "lucide-react";
import { usePosStore } from "../../store/usePosStore";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatDate } from "@erp-bijoux/shared-ui";

export function ReceiptModal() {
  const { lastCompletedSale, resetLastSale } = usePosStore();
  const { storeInfo } = useUserStore();

  if (!lastCompletedSale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={Boolean(lastCompletedSale)}
      onClose={resetLastSale}
      title={
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Vente Validée avec Succès</span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Receipt Styled Preview (Simulated 80mm POS Thermal Paper) */}
        <div
          id="printable-receipt"
          className="bg-white text-slate-900 p-6 rounded-xl font-mono text-xs shadow-2xl border border-slate-300 space-y-3"
        >
          {/* Header */}
          <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
            <h2 className="text-base font-black tracking-wider uppercase">{storeInfo.name}</h2>
            <p className="text-[11px] text-slate-600">{storeInfo.address}</p>
            <p className="text-[11px] text-slate-600">Tél : {storeInfo.phone}</p>
            <p className="text-[10px] text-slate-500">SIRET : {storeInfo.siret}</p>
            <p className="text-[10px] text-slate-500">TVA Intracom : {storeInfo.tvaIntra}</p>
          </div>

          {/* Ticket metadata */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
            <div className="flex justify-between">
              <span>Ticket : {lastCompletedSale.ticketNumber}</span>
              <span>Caisse : {storeInfo.posNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date : {formatDate(lastCompletedSale.createdAt)}</span>
              <span>Vendeur : {lastCompletedSale.sellerName}</span>
            </div>
            {lastCompletedSale.customerName && (
              <div className="pt-0.5 font-bold">Client : {lastCompletedSale.customerName}</div>
            )}
          </div>

          {/* Items list */}
          <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3">
            {lastCompletedSale.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span className="truncate pr-2">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="whitespace-nowrap">{formatCurrency(item.totalTTC)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ref: {item.reference}</span>
                  {item.discountPercent > 0 && <span>Remise -{item.discountPercent}%</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
            <div className="flex justify-between text-[11px]">
              <span>Sous-total HT :</span>
              <span>{formatCurrency(lastCompletedSale.subtotalHT)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>TVA totale :</span>
              <span>{formatCurrency(lastCompletedSale.totalVAT)}</span>
            </div>
            <div className="flex justify-between text-base font-black pt-1">
              <span>TOTAL TTC :</span>
              <span>{formatCurrency(lastCompletedSale.totalTTC)}</span>
            </div>
          </div>

          {/* Detailed VAT breakdown */}
          <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2">
            <span className="font-bold block text-slate-700">Ventilation TVA (NF525) :</span>
            {Object.entries(lastCompletedSale.vatBreakdown).map(([rate, vals]) => (
              <div key={rate} className="flex justify-between text-slate-600">
                <span>Taux {rate} :</span>
                <span>
                  Base {formatCurrency(vals.baseHT)} | Taxe {formatCurrency(vals.vatAmount)}
                </span>
              </div>
            ))}
          </div>

          {/* Payments list */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[11px]">
            <span className="font-bold block">Mode de règlement :</span>
            {lastCompletedSale.payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {p.method.replace("_", " ")}
                  {p.authorizationCode && ` (${p.authorizationCode})`}
                </span>
                <span className="font-bold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {lastCompletedSale.changeGiven > 0 && (
              <div className="flex justify-between text-emerald-800 font-bold pt-1">
                <span>Monnaie rendue :</span>
                <span>{formatCurrency(lastCompletedSale.changeGiven)}</span>
              </div>
            )}
          </div>

          {/* Legal Fiscal Footer (NF525 compliant) */}
          <div className="text-center space-y-1 pt-2 text-[9px] text-slate-600">
            <p>Signature numérique sécurisée :</p>
            <p className="font-mono text-[8px] tracking-wider break-all text-slate-800 font-bold">
              SHA256:{lastCompletedSale.fiscalHash}
            </p>
            <p className="pt-1 font-semibold uppercase text-slate-700">
              Merci de votre confiance • Maison Joaillière
            </p>
            <p className="text-[8px] text-slate-400">Garantie 2 ans pièces & main d'œuvre</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Ticket Thermique</span>
          </button>

          <button
            onClick={resetLastSale}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Nouvelle Vente</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
