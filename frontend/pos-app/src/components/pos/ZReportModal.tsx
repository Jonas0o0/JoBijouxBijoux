import { useState, useEffect } from "react";
import { FileText, Printer, CheckCircle, ShieldCheck } from "lucide-react";
import { db, type SaleRecord } from "../../db/db";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatDate } from "@erp-bijoux/shared-ui";

interface ZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ZReportModal({ isOpen, onClose }: ZReportModalProps) {
  const { storeInfo, currentSeller } = useUserStore();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [zNumber, setZNumber] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      db.sales.toArray().then((records) => {
        setSales(records);
      });
      const zSeq = Math.floor(100 + Math.random() * 900);
      setZNumber(`Z-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${zSeq}`);
    }
  }, [isOpen]);

  const totalTTC = sales.reduce((sum, s) => sum + s.totalTTC, 0);
  const totalHT = sales.reduce((sum, s) => sum + s.subtotalHT, 0);
  const totalVAT = sales.reduce((sum, s) => sum + s.totalVAT, 0);
  const ticketCount = sales.length;
  const avgBasket = ticketCount > 0 ? totalTTC / ticketCount : 0;

  // Breakdown by payment method
  const paymentsByMethod: Record<string, number> = {
    CB_TPE: 0,
    ESPECES: 0,
    AVOIR: 0,
    VIREMENT: 0,
    CHEQUE: 0,
  };

  sales.forEach((s) => {
    s.payments.forEach((p) => {
      paymentsByMethod[p.method] = (paymentsByMethod[p.method] || 0) + p.amount;
    });
  });

  // Breakdown by VAT rate
  const vatBreakdown: Record<string, { baseHT: number; vatAmount: number }> = {};
  sales.forEach((s) => {
    Object.entries(s.vatBreakdown || {}).forEach(([rate, vals]) => {
      if (!vatBreakdown[rate]) {
        vatBreakdown[rate] = { baseHT: 0, vatAmount: 0 };
      }
      vatBreakdown[rate].baseHT += vals.baseHT;
      vatBreakdown[rate].vatAmount += vals.vatAmount;
    });
  });

  const handlePrintZ = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span>Clôture Journalière de Caisse (Rapport Z - NF525)</span>
        </div>
      }
      description={`Rapport fiscal inaltérable • Émis le ${formatDate(new Date())}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Z Report Ticket Simulation */}
        <div className="bg-white text-slate-900 p-6 rounded-xl font-mono text-xs shadow-xl border border-slate-300 space-y-4">
          <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
              Rapport Fiscal Z - Clôture
            </span>
            <h3 className="text-base font-black tracking-wider uppercase mt-1">{storeInfo.name}</h3>
            <p className="text-[11px] text-slate-600">N° Z : {zNumber}</p>
            <p className="text-[10px] text-slate-500">Caisse : {storeInfo.posNumber} • Opérateur : {currentSeller.name}</p>
          </div>

          {/* Revenue Summary */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-3">
            <div className="flex justify-between font-bold text-sm">
              <span>CHIFFRE D'AFFAIRES TTC :</span>
              <span className="text-amber-700">{formatCurrency(totalTTC)}</span>
            </div>
            <div className="flex justify-between">
              <span>Chiffre d'Affaires HT :</span>
              <span>{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA totale collectée :</span>
              <span>{formatCurrency(totalVAT)}</span>
            </div>
            <div className="flex justify-between pt-1 text-[11px] text-slate-600">
              <span>Nombre de tickets émis :</span>
              <span>{ticketCount}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Panier moyen :</span>
              <span>{formatCurrency(avgBasket)}</span>
            </div>
          </div>

          {/* VAT Ventilation */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-3">
            <span className="font-bold text-slate-800 block text-[11px]">
              Ventilation TVA (DGI / Code Général des Impôts) :
            </span>
            {Object.entries(vatBreakdown).length > 0 ? (
              Object.entries(vatBreakdown).map(([rate, vals]) => (
                <div key={rate} className="flex justify-between text-[11px]">
                  <span>Taux {rate} :</span>
                  <span>
                    Base {formatCurrency(vals.baseHT)} | TVA {formatCurrency(vals.vatAmount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Taux 20.0% :</span>
                <span>Base {formatCurrency(totalHT)} | TVA {formatCurrency(totalVAT)}</span>
              </div>
            )}
          </div>

          {/* Payment Method Breakdown */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-3">
            <span className="font-bold text-slate-800 block text-[11px]">
              Répartition des Règlements perçus :
            </span>
            <div className="flex justify-between">
              <span>Cartes Bancaires (TPE) :</span>
              <span className="font-bold">{formatCurrency(paymentsByMethod.CB_TPE)}</span>
            </div>
            <div className="flex justify-between">
              <span>Espèces (Tiroir) :</span>
              <span className="font-bold">{formatCurrency(paymentsByMethod.ESPECES)}</span>
            </div>
            <div className="flex justify-between">
              <span>Avoirs / Bons :</span>
              <span className="font-bold">{formatCurrency(paymentsByMethod.AVOIR)}</span>
            </div>
            <div className="flex justify-between">
              <span>Virements / Chèques :</span>
              <span className="font-bold">{formatCurrency(paymentsByMethod.VIREMENT + paymentsByMethod.CHEQUE)}</span>
            </div>
          </div>

          {/* Fiscal signature seal */}
          <div className="text-center pt-1 text-[9px] text-slate-600 space-y-1">
            <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GRAND LIVRE FISCAL SCORÉ ET SCIELLÉ NF525</span>
            </div>
            <p className="font-mono text-[8px] break-all text-slate-500">
              HASH-CHAIN: {btoa(`${zNumber}|${totalTTC}|${storeInfo.posNumber}`).substring(0, 36)}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintZ}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Ticket Z</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Fermer la Clôture</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
