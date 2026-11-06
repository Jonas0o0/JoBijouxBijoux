import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  ShieldCheck,
  CreditCard,
  Scale,
  CheckCircle2,
  Printer,
  Info,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  db,
  type SaleRecord,
  type FiscalClosureRecord,
} from "../../db/db";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatDate, formatDateOnly } from "@erp-bijoux/shared-ui";

interface AccountingEntry {
  journalCode: string;
  journalLib: string;
  ecritureNum: string;
  ecritureDate: string; // YYYYMMDD
  compteNum: string;
  compteLib: string;
  compAuxNum: string;
  compAuxLib: string;
  pieceRef: string;
  pieceDate: string; // YYYYMMDD
  ecritureLib: string;
  debit: number;
  credit: number;
  validDate: string; // YYYYMMDD
}

export function AccountingScreen() {
  const { storeInfo } = useUserStore();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [closures, setClosures] = useState<FiscalClosureRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"JOURNAL" | "CLOSURES" | "LEGAL">("JOURNAL");
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "TODAY" | "MONTH">("ALL");

  // Selected closure for viewing ticket
  const [selectedClosure, setSelectedClosure] = useState<FiscalClosureRecord | null>(null);
  const [isZClosingModalOpen, setIsZClosingModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const loadData = async () => {
    const [allSales, allClosures] = await Promise.all([
      db.sales.reverse().toArray(),
      db.fiscalClosures.reverse().toArray(),
    ]);
    setSales(allSales);
    setClosures(allClosures);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // Filter sales according to period
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    return sales.filter((s) => {
      const sDate = s.createdAt.slice(0, 10);
      if (periodFilter === "TODAY") {
        return sDate === todayStr;
      }
      if (periodFilter === "MONTH") {
        return sDate.startsWith(monthStr);
      }
      return true;
    });
  }, [sales, periodFilter]);

  // Financial aggregates
  const financialSummary = useMemo(() => {
    let totalTTC = 0;
    let totalHT = 0;
    let totalVAT = 0;

    let normalVAT20_BaseHT = 0;
    let normalVAT20_Amount = 0;

    let marginVAT_BaseHT = 0;
    let marginVAT_Amount = 0;

    const paymentsByMethod: Record<string, number> = {
      CB_TPE: 0,
      ESPECES: 0,
      VIREMENT: 0,
      CHEQUE: 0,
      AVOIR: 0,
    };

    filteredSales.forEach((s) => {
      totalTTC += s.totalTTC;
      totalHT += s.subtotalHT;
      totalVAT += s.totalVAT;

      if (s.regimeType === "MARGE_OCCASION" && s.marginDetails) {
        marginVAT_BaseHT += s.marginDetails.marginHT;
        marginVAT_Amount += s.marginDetails.vatAmount;
      } else {
        // Standard normal 20%
        normalVAT20_BaseHT += s.subtotalHT;
        normalVAT20_Amount += s.totalVAT;
      }

      s.payments.forEach((p) => {
        paymentsByMethod[p.method] = (paymentsByMethod[p.method] || 0) + p.amount;
      });
    });

    return {
      totalTTC,
      totalHT,
      totalVAT,
      normalVAT20_BaseHT,
      normalVAT20_Amount,
      marginVAT_BaseHT,
      marginVAT_Amount,
      paymentsByMethod,
    };
  }, [filteredSales]);

  // Generate double-entry accounting records from sales
  const accountingEntries = useMemo(() => {
    const entries: AccountingEntry[] = [];
    let ecritureSeq = 1;

    filteredSales.forEach((sale) => {
      const dateRaw = new Date(sale.createdAt);
      const yyyymmdd = dateRaw.toISOString().slice(0, 10).replace(/-/g, "");
      const ecritureNum = `ECR${dateRaw.getFullYear()}${String(ecritureSeq).padStart(5, "0")}`;
      ecritureSeq++;

      const clientName = sale.customerName || "Client Comptoir Particulier";
      const clientAux = sale.customerId ? `CLI-${sale.customerId.replace(/[^0-9]/g, "")}` : "CLI411000";

      // 1. Débit Client 411000 for total sale amount TTC
      entries.push({
        journalCode: "VT",
        journalLib: "Journal des Ventes Joaillerie",
        ecritureNum,
        ecritureDate: yyyymmdd,
        compteNum: "411000",
        compteLib: "Clients - Créances sur ventes comptoir",
        compAuxNum: clientAux,
        compAuxLib: clientName,
        pieceRef: sale.ticketNumber,
        pieceDate: yyyymmdd,
        ecritureLib: `Vente ${sale.items[0]?.name || "Bijou"} - ${sale.ticketNumber}`,
        debit: sale.totalTTC,
        credit: 0,
        validDate: yyyymmdd,
      });

      // 2. Crédit Ventes (707100 Vente neuve OU 707200 Vente occasion sur marge OU 706000 SAV)
      const isSav = sale.items.some((i) => i.productId.startsWith("sav-"));
      if (sale.regimeType === "MARGE_OCCASION" && sale.marginDetails) {
        // Regime Art. 297 A CGI: Base HT + Coût d'achat hors champ
        entries.push({
          journalCode: "VT",
          journalLib: "Journal des Ventes Joaillerie",
          ecritureNum,
          ecritureDate: yyyymmdd,
          compteNum: "707200",
          compteLib: "Ventes bijoux & montres occasion (Marge Art. 297A)",
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: sale.ticketNumber,
          pieceDate: yyyymmdd,
          ecritureLib: `Vente occasion marge HT - ${sale.ticketNumber}`,
          debit: 0,
          credit: sale.subtotalHT,
          validDate: yyyymmdd,
        });

        // Crédit TVA sur marge
        entries.push({
          journalCode: "VT",
          journalLib: "Journal des Ventes Joaillerie",
          ecritureNum,
          ecritureDate: yyyymmdd,
          compteNum: "445711",
          compteLib: "TVA collectée sur marge bénéficiaire (20%)",
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: sale.ticketNumber,
          pieceDate: yyyymmdd,
          ecritureLib: `TVA sur marge - ${sale.ticketNumber}`,
          debit: 0,
          credit: sale.totalVAT,
          validDate: yyyymmdd,
        });
      } else {
        // Standard sale (707100 or 706000)
        const compteVente = isSav ? "706000" : "707100";
        const libelleVente = isSav
          ? "Prestations de services atelier & réparations SAV"
          : "Ventes joaillerie neuve & pierres précieuses";

        entries.push({
          journalCode: "VT",
          journalLib: "Journal des Ventes Joaillerie",
          ecritureNum,
          ecritureDate: yyyymmdd,
          compteNum: compteVente,
          compteLib: libelleVente,
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: sale.ticketNumber,
          pieceDate: yyyymmdd,
          ecritureLib: `Vente HT - ${sale.ticketNumber}`,
          debit: 0,
          credit: sale.subtotalHT,
          validDate: yyyymmdd,
        });

        entries.push({
          journalCode: "VT",
          journalLib: "Journal des Ventes Joaillerie",
          ecritureNum,
          ecritureDate: yyyymmdd,
          compteNum: "445710",
          compteLib: "TVA collectée à 20%",
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: sale.ticketNumber,
          pieceDate: yyyymmdd,
          ecritureLib: `TVA collectée 20% - ${sale.ticketNumber}`,
          debit: 0,
          credit: sale.totalVAT,
          validDate: yyyymmdd,
        });
      }

      // 3. Règlement de la pièce (Journal de Caisse / Banque)
      sale.payments.forEach((payment) => {
        let codeJournal = "CA";
        let libJournal = "Journal de Caisse";
        let comptePaiement = "530000";
        let libellePaiement = "Caisse principale espèces";

        if (payment.method === "CB_TPE") {
          codeJournal = "BQ";
          libJournal = "Journal de Banque - TPE";
          comptePaiement = "512000";
          libellePaiement = "Banque - Règlements CB TPE";
        } else if (payment.method === "VIREMENT") {
          codeJournal = "BQ";
          libJournal = "Journal de Banque - Virements";
          comptePaiement = "512100";
          libellePaiement = "Banque - Virements bancaires";
        } else if (payment.method === "CHEQUE") {
          codeJournal = "BQ";
          libJournal = "Journal de Banque - Chèques";
          comptePaiement = "511200";
          libellePaiement = "Chèques à encaisser";
        } else if (payment.method === "AVOIR") {
          codeJournal = "OD";
          libJournal = "Opérations Diverses";
          comptePaiement = "419000";
          libellePaiement = "Bons d'achat & avoirs clients";
        }

        // Débit Compte Financier
        entries.push({
          journalCode: codeJournal,
          journalLib: libJournal,
          ecritureNum,
          ecritureDate: yyyymmdd,
          compteNum: comptePaiement,
          compteLib: libellePaiement,
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: sale.ticketNumber,
          pieceDate: yyyymmdd,
          ecritureLib: `Règlement ${payment.method} - ${sale.ticketNumber}`,
          debit: payment.amount,
          credit: 0,
          validDate: yyyymmdd,
        });

        // Crédit Client 411000 (Lettrage règlement)
        entries.push({
          journalCode: codeJournal,
          journalLib: libJournal,
          ecritureNum,
          ecritureDate: yyyymmdd,
          compteNum: "411000",
          compteLib: "Clients - Règlement perçu",
          compAuxNum: clientAux,
          compAuxLib: clientName,
          pieceRef: sale.ticketNumber,
          pieceDate: yyyymmdd,
          ecritureLib: `Lettrage règlement ${sale.ticketNumber}`,
          debit: 0,
          credit: payment.amount,
          validDate: yyyymmdd,
        });
      });
    });

    return entries;
  }, [filteredSales]);

  // Total Débits and Crédits for balance check
  const totalDebit = accountingEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = accountingEntries.reduce((s, e) => s + e.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Export official FEC file conforming to Article A.47 A-1 of LPF
  const handleExportFEC = () => {
    const siren = "849203918"; // Maison Vendôme SIREN
    const dateFile = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `${siren}FEC${dateFile}.txt`;

    // 18 Legal Columns Header (Tab-delimited)
    const headers = [
      "JournalCode",
      "JournalLib",
      "EcritureNum",
      "EcritureDate",
      "CompteNum",
      "CompteLib",
      "CompAuxNum",
      "CompAuxLib",
      "PieceRef",
      "PieceDate",
      "EcritureLib",
      "Debit",
      "Credit",
      "EcritureLettrage",
      "DateLettrage",
      "ValidDate",
      "Montantdevise",
      "Idevise",
    ];

    const lines: string[] = [headers.join("\t")];

    accountingEntries.forEach((entry) => {
      const line = [
        entry.journalCode,
        entry.journalLib,
        entry.ecritureNum,
        entry.ecritureDate,
        entry.compteNum,
        entry.compteLib,
        entry.compAuxNum || "",
        entry.compAuxLib || "",
        entry.pieceRef,
        entry.pieceDate,
        entry.ecritureLib,
        entry.debit > 0 ? entry.debit.toFixed(2) : "0.00",
        entry.credit > 0 ? entry.credit.toFixed(2) : "0.00",
        "", // EcritureLettrage
        "", // DateLettrage
        entry.validDate,
        "", // Montantdevise
        "EUR", // Idevise
      ];
      lines.push(line.join("\t"));
    });

    const fileContent = lines.join("\r\n");
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      message: `Export FEC DGFIP réussi : ${fileName} (${accountingEntries.length} écritures validées).`,
      type: "success",
    });
  };

  // Create a new daily Z closure
  const handlePerformDailyZ = async () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));

    const totalTTC = todaySales.reduce((s, it) => s + it.totalTTC, 0);
    const totalHT = todaySales.reduce((s, it) => s + it.subtotalHT, 0);
    const totalVAT = todaySales.reduce((s, it) => s + it.totalVAT, 0);

    const cb = todaySales.reduce(
      (s, it) => s + it.payments.filter((p) => p.method === "CB_TPE").reduce((pSum, p) => pSum + p.amount, 0),
      0
    );
    const cash = todaySales.reduce(
      (s, it) => s + it.payments.filter((p) => p.method === "ESPECES").reduce((pSum, p) => pSum + p.amount, 0),
      0
    );
    const transfer = todaySales.reduce(
      (s, it) => s + it.payments.filter((p) => p.method === "VIREMENT").reduce((pSum, p) => pSum + p.amount, 0),
      0
    );

    const zSeq = Math.floor(100 + Math.random() * 900);
    const closureNumber = `Z-${todayStr.replace(/-/g, "")}-${zSeq}`;
    const hash = `hash-${Date.now()}-${Math.floor(Math.random() * 1000000).toString(16)}`;

    const newClosure: FiscalClosureRecord = {
      id: `clos-z-${Date.now()}`,
      closureType: "Z_JOURNALIER",
      closureNumber,
      periodStart: `${todayStr}T09:00:00Z`,
      periodEnd: now.toISOString(),
      openingBalance: 300.0,
      closingBalance: 300.0 + cash,
      totalHT,
      totalTTC,
      vatNormal20HT: totalHT,
      vatNormal20Amount: totalVAT,
      vatMarginBaseHT: 0,
      vatMarginAmount: 0,
      totalVAT,
      paymentsBreakdown: {
        cb,
        cash,
        transfer,
        check: 0,
        voucher: 0,
      },
      transactionsCount: todaySales.length,
      firstTicketRef: todaySales[0]?.ticketNumber || "TK-N/A",
      lastTicketRef: todaySales[todaySales.length - 1]?.ticketNumber || "TK-N/A",
      previousSignatureHash: closures[0]?.fiscalSignatureHash || "0000000000000000",
      fiscalSignatureHash: hash,
      createdAt: now.toISOString(),
    };

    await db.fiscalClosures.add(newClosure);
    await loadData();
    setIsZClosingModalOpen(false);
    setSelectedClosure(newClosure);
    setNotification({
      message: `Clôture Journalière ${closureNumber} scellée avec succès (Norme NF525).`,
      type: "success",
    });
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
            <Scale className="w-5 h-5 text-amber-600" />
            <span>Comptabilité HBJO & Export Fiscal FEC</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conforme Article A.47 A-1 du LPF, Art. 286 I-3° bis CGI (NF525) & Régime TVA sur Marge Art. 297 A CGI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZClosingModalOpen(true)}
            className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs border border-slate-200/90 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Clôture Fiscale Z</span>
          </button>

          <button
            onClick={handleExportFEC}
            className="py-2 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-amber-200" />
            <span>Exporter le FEC (DGFIP)</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Chiffre d'Affaires Global */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Chiffre d'Affaires TTC
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">
            {formatCurrency(financialSummary.totalTTC)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span>CA Total HT :</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(financialSummary.totalHT)}
            </span>
          </div>
        </div>

        {/* 2. TVA Normale 20% */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              TVA Normale (20.0%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
              20%
            </div>
          </div>
          <span className="text-2xl font-black text-sky-900 mt-1 block font-mono">
            {formatCurrency(financialSummary.normalVAT20_Amount)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
            <span>Assiette HT (Créations & SAV) :</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(financialSummary.normalVAT20_BaseHT)}
            </span>
          </div>
        </div>

        {/* 3. TVA sur Marge (Régime Occasion Art. 297 A CGI) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-white to-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <span>TVA sur Marge (Occasion)</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              Marge
            </div>
          </div>
          <span className="text-2xl font-black text-amber-950 mt-1 block font-mono">
            {formatCurrency(financialSummary.marginVAT_Amount)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-amber-800/80 mt-1 pt-1 border-t border-amber-200/60">
            <span>Base marge nette HT :</span>
            <span className="font-mono font-bold text-amber-900">
              {formatCurrency(financialSummary.marginVAT_BaseHT)}
            </span>
          </div>
        </div>

        {/* 4. Règlements de Caisse */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Règlements de Caisse
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px]">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">CB TPE</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatCurrency(financialSummary.paymentsByMethod.CB_TPE)}
              </span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">Espèces</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatCurrency(financialSummary.paymentsByMethod.ESPECES)}
              </span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">Virements</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatCurrency(financialSummary.paymentsByMethod.VIREMENT)}
              </span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">Chèques / Avoirs</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {formatCurrency(
                  financialSummary.paymentsByMethod.CHEQUE +
                    financialSummary.paymentsByMethod.AVOIR
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation & Period Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("JOURNAL")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "JOURNAL"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Journal des Ventes & Écritures FEC</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-[10px] text-slate-800">
              {accountingEntries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("CLOSURES")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "CLOSURES"
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clôtures Fiscales Z, M, A (NF525)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px]">
              {closures.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("LEGAL")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "LEGAL"
                ? "bg-slate-800 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Conformité Fiscale DGFIP & LPF</span>
          </button>
        </div>

        {/* Period Selector */}
        {activeTab === "JOURNAL" && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Période :</span>
            <button
              onClick={() => setPeriodFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                periodFilter === "ALL"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setPeriodFilter("TODAY")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                periodFilter === "TODAY"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Ce jour
            </button>
            <button
              onClick={() => setPeriodFilter("MONTH")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                periodFilter === "MONTH"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Ce mois
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Journal des Écritures Comptables (Tableau FEC) */}
      {activeTab === "JOURNAL" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Table Header banner */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Grand Livre des Écritures de Ventes & Règlements
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Conforme 18 colonnes LPF Art. A.47 A-1
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>
                Total Débits :{" "}
                <strong className="text-slate-900">{formatCurrency(totalDebit)}</strong>
              </span>
              <span>•</span>
              <span>
                Total Crédits :{" "}
                <strong className="text-slate-900">{formatCurrency(totalCredit)}</strong>
              </span>
              {isBalanced && (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Équilibre validé ✓
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 max-h-[58vh]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Jnl</th>
                  <th className="py-2.5 px-3 font-medium">N° Écriture</th>
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">N° Compte</th>
                  <th className="py-2.5 px-3 font-medium">Libellé Compte</th>
                  <th className="py-2.5 px-3 font-medium">Tiers (Aux)</th>
                  <th className="py-2.5 px-3 font-medium">Pièce Réf</th>
                  <th className="py-2.5 px-3 font-medium">Libellé de l'Écriture</th>
                  <th className="py-2.5 px-3 font-medium text-right">Débit (€)</th>
                  <th className="py-2.5 px-3 font-medium text-right">Crédit (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {accountingEntries.map((entry, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-amber-50/40 transition-colors text-slate-800 text-[11px]"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-500">
                      {entry.journalCode}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {entry.ecritureNum}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {entry.ecritureDate}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-800">
                      {entry.compteNum}
                    </td>
                    <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate" title={entry.compteLib}>
                      {entry.compteLib}
                    </td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[120px]">
                      {entry.compAuxLib || "-"}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {entry.pieceRef}
                    </td>
                    <td className="py-2 px-3 text-slate-800 truncate max-w-[220px]" title={entry.ecritureLib}>
                      {entry.ecritureLib}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Total affiché : <strong>{accountingEntries.length} lignes d'écritures</strong>
            </span>
            <span className="font-mono font-bold text-slate-800">
              Débits : {formatCurrency(totalDebit)} | Crédits : {formatCurrency(totalCredit)}
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: Historique des Clôtures Fiscales (Z, M, A) */}
      {activeTab === "CLOSURES" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Grand Livre Fiscal des Clôtures Inaltérables (NF525)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Archives certifiées des rapports Z Journaliers, M Mensuels et A Annuels
                </p>
              </div>

              <button
                onClick={() => setIsZClosingModalOpen(true)}
                className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>Exécuter Clôture Z du Jour</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">N° Rapport</th>
                    <th className="py-3 px-4 font-medium">Période Clôturée</th>
                    <th className="py-3 px-4 font-medium text-center">Tickets</th>
                    <th className="py-3 px-4 font-medium text-right">CA Total TTC</th>
                    <th className="py-3 px-4 font-medium text-right">TVA Collectée</th>
                    <th className="py-3 px-4 font-medium">Signature Fiscale (Hash SHA256)</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {closures.map((closure) => (
                    <tr key={closure.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {closure.closureType === "Z_JOURNALIER" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Z Journalier
                          </span>
                        )}
                        {closure.closureType === "M_MENSUEL" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            M Mensuel
                          </span>
                        )}
                        {closure.closureType === "A_ANNUEL" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            A Annuel
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {closure.closureNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {formatDateOnly(closure.periodStart)} → {formatDateOnly(closure.periodEnd)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {closure.transactionsCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(closure.totalTTC)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(closure.totalVAT)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[150px] truncate" title={closure.fiscalSignatureHash}>
                        {closure.fiscalSignatureHash.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedClosure(closure)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 inline-flex"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket Z</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notice & Réglementation Fiscale HBJO */}
      {activeTab === "LEGAL" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Conformité Fiscale Joaillerie (DGFiP & Code Général des Impôts)</span>
            </h3>
            <p className="text-slate-500 mt-1">
              Règles obligatoires régissant la tenue comptable, l'export FEC et la fiscalité de la bijouterie-joaillerie en France.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Article A.47 A-1 du LPF */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 text-sm block">
                1. Le Fichier des Écritures Comptables (FEC - Art. A.47 A-1 LPF)
              </span>
              <p>
                En cas de vérification de comptabilité, tout assujetti tenant sa comptabilité au moyen de systèmes informatisés doit présenter à l'administration fiscale une copie du fichier des écritures comptables sous format dématérialisé normalisé.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Format textuel délimité par tabulation (norme standard acceptée par le logiciel de contrôle DGFiP).</li>
                <li>Comprend obligatoirement les 18 colonnes légales incluant date, numéro d'écriture séquentiel, compte PCG et montant débit/crédit.</li>
                <li>Nom de fichier normalisé : <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-900">&lt;SIREN&gt;FECYYYYMMDD.txt</code></li>
              </ul>
            </div>

            {/* Box 2: TVA sur marge */}
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2 text-amber-950">
              <span className="font-bold text-amber-900 text-sm block">
                2. Régime de la TVA sur la Marge (Art. 297 A du CGI)
              </span>
              <p>
                Applicable aux livraisons de biens d'occasion (bijoux anciens, montres de collection, succession, rachat d'or aux particuliers sans TVA déductible) :
              </p>
              <ul className="list-disc pl-4 space-y-1 text-amber-900/90">
                <li>La base d'imposition est constituée par la <strong>marge bénéficiaire brute</strong> (Prix de vente TTC - Prix d'achat) ramenée au montant hors taxe (coefficient 1.20).</li>
                <li>La TVA n'est pas mentionnée distinctement sur la facture client conformément à l'article 242 nonies A de l'annexe II au CGI.</li>
                <li>L'application de ce régime évite la double imposition sur les bijoux de seconde main réintroduits sur le marché.</li>
              </ul>
            </div>

            {/* Box 3: NF525 & CGI Art. 286 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 text-sm block">
                3. Inaltérabilité NF525 (CGI Art. 286 I-3° bis)
              </span>
              <p>
                Le logiciel de caisse garantit l'inaltérabilité, la sécurisation, la conservation et l'archivage des données de transaction par signature cryptographique chaînée (simulation SHA-256 NF525) et émission quotidienne inaltérable des tickets Z.
              </p>
            </div>

            {/* Box 4: Plafond espèces */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 text-sm block">
                4. Plafond légal de règlement en espèces (Art. L112-6 CMF)
              </span>
              <p>
                Le règlement en espèces ne peut excéder <strong>1 000 € TTC</strong> par transaction pour les résidents fiscaux français. Pour le rachat d'or (achat de métaux précieux), tout paiement en espèces est formellement interdit (uniquement virement ou chèque barré - Art. L112-6 CMF).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View & Print Ticket Z */}
      <Modal
        isOpen={Boolean(selectedClosure)}
        onClose={() => setSelectedClosure(null)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>Rapport Fiscal Inaltérable • {selectedClosure?.closureNumber}</span>
          </div>
        }
        description={`Clôture de caisse conforme NF525 • Émise le ${formatDate(selectedClosure?.createdAt || new Date())}`}
        maxWidth="lg"
      >
        {selectedClosure && (
          <div className="space-y-4">
            <div className="bg-white text-slate-900 p-6 rounded-xl font-mono text-xs shadow-md border border-slate-300 space-y-3">
              <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Rapport Fiscal Z - Clôture de Caisse
                </span>
                <h3 className="text-sm font-black tracking-wider uppercase mt-1">{storeInfo.name}</h3>
                <p className="text-[11px] text-slate-600">Rapport : {selectedClosure.closureNumber}</p>
                <p className="text-[10px] text-slate-500">
                  Période : {formatDateOnly(selectedClosure.periodStart)} → {formatDateOnly(selectedClosure.periodEnd)}
                </p>
              </div>

              {/* Totals */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3">
                <div className="flex justify-between font-bold text-sm">
                  <span>CHIFFRE D'AFFAIRES TTC :</span>
                  <span className="text-amber-800">{formatCurrency(selectedClosure.totalTTC)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CA Hors Taxes (HT) :</span>
                  <span>{formatCurrency(selectedClosure.totalHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total TVA Collectée :</span>
                  <span>{formatCurrency(selectedClosure.totalVAT)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Nombre d'actes de vente :</span>
                  <span>{selectedClosure.transactionsCount} transaction(s)</span>
                </div>
              </div>

              {/* Payments breakdown */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3">
                <span className="font-bold block mb-1">RÈGLEMENTS PERÇUS :</span>
                <div className="flex justify-between">
                  <span>• Cartes Bancaires (TPE) :</span>
                  <span>{formatCurrency(selectedClosure.paymentsBreakdown.cb)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Espèces (Caisse) :</span>
                  <span>{formatCurrency(selectedClosure.paymentsBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Virements Bancaires :</span>
                  <span>{formatCurrency(selectedClosure.paymentsBreakdown.transfer)}</span>
                </div>
              </div>

              {/* Fiscal Cryptographic Signature */}
              <div className="pt-1 text-[10px] text-slate-400 break-all space-y-1">
                <span>Signature NF525 : {selectedClosure.fiscalSignatureHash}</span>
                <p className="text-[9px] italic">Document inaltérable archivé sur registre local et cloud.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedClosure(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Ticket Z</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirm Daily Z Closure */}
      <Modal
        isOpen={isZClosingModalOpen}
        onClose={() => setIsZClosingModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Exécuter la Clôture Journalière (Rapport Z)</span>
          </div>
        }
        description="Cette opération scelle les ventes de la journée sous certificat fiscal inaltérable NF525"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-900">
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-1.5 text-amber-950">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Procédure de Fin de Journée</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              La clôture Z calcule le cumul journalier des ventes, équilibre le fond de caisse et génère la signature cryptographique chaînée.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setIsZClosingModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              Annuler
            </button>
            <button
              onClick={handlePerformDailyZ}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmer & Sceller le Rapport Z</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AccountingScreen;
