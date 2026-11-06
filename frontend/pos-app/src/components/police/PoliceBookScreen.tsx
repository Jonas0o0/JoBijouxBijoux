import { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { db, type PoliceBookEntry } from "../../db/db";
import { useUserStore } from "../../store/useUserStore";
import { formatCurrency, formatWeight, formatDateOnly } from "@erp-bijoux/shared-ui";

export function PoliceBookScreen() {
  const { storeInfo } = useUserStore();
  const [entries, setEntries] = useState<PoliceBookEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [movementFilter, setMovementFilter] = useState<string>("ALL");

  const loadEntries = async () => {
    const list = await db.policeBook.orderBy("orderNumber").toArray();
    setEntries(list);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = entries.filter((e) => {
    const matchesFilter = movementFilter === "ALL" || e.movementType === movementFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.natureOfGoods.toLowerCase().includes(q) ||
      e.partyName.toLowerCase().includes(q) ||
      e.invoiceOrContractRef.toLowerCase().includes(q) ||
      String(e.orderNumber).includes(q);

    return matchesFilter && matchesSearch;
  });

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "N° d'Ordre",
      "Date",
      "Mouvement",
      "Description des Objets",
      "Métal & Titre",
      "Poids Brut (g)",
      "Poids Net (g)",
      "Poinçon / Numéro",
      "Nom Client / Fournisseur",
      "Adresse",
      "Pièce d'Identité",
      "Prix Achat (€)",
      "Prix Vente (€)",
      "Mode Règlement",
      "Réf Facture/Contrat",
      "Empreinte Sécurité (Hash)",
    ];

    const rows = filteredEntries.map((e) => [
      e.orderNumber,
      e.date,
      e.movementType,
      `"${e.natureOfGoods.replace(/"/g, '""')}"`,
      `"${e.metalAndFineness.replace(/"/g, '""')}"`,
      e.grossWeightGrams.toFixed(3),
      e.netWeightGrams.toFixed(3),
      `"${(e.individualNumberOrHallmark || "").replace(/"/g, '""')}"`,
      `"${e.partyName.replace(/"/g, '""')}"`,
      `"${e.partyAddress.replace(/"/g, '""')}"`,
      `"${(e.partyIdDocument || "").replace(/"/g, '""')}"`,
      e.purchasePrice ? e.purchasePrice.toFixed(2) : "",
      e.sellingPrice ? e.sellingPrice.toFixed(2) : "",
      `"${e.paymentMethod}"`,
      `"${e.invoiceOrContractRef}"`,
      e.sealedHash,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Livre_de_Police_${storeInfo.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Livre de Police Joaillerie (Registre des Objets Mobiliers)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registre inaltérable conforme à l'Article 537 du CGI et Art. 321-7 du Code Pénal • Scellé cryptographique
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-200 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Registre</span>
          </button>
        </div>
      </div>

      {/* Legal Compliance Banner */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Registre dématérialisé à force probante :</strong> Chiffrage et chaînage séquentiel
            garantissant l'absence d'omission, de trou dans la numérotation ou de modification a posteriori.
          </span>
        </div>
        <span className="font-mono text-amber-900 bg-amber-50 font-bold px-3 py-1 rounded-xl border border-amber-200">
          {entries.length} écritures enregistrées
        </span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher n° d'ordre, client, bijou, réf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs scrollbar-none">
          {[
            { id: "ALL", label: "Tous les mouvements" },
            { id: "ACHAT", label: "Achats" },
            { id: "VENTE", label: "Ventes" },
            { id: "RACHAT_OR", label: "Rachats d'Or" },
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setMovementFilter(flt.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all shadow-xs ${
                movementFilter === flt.id
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Police Book Immutable Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 font-bold">N° Ordre</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Mouvement</th>
                <th className="py-3 px-4 font-sans">Description Détaillée du Bijou</th>
                <th className="py-3 px-3">Métal & Titre</th>
                <th className="py-3 px-3">Poids Brut</th>
                <th className="py-3 px-4 font-sans">Contrepartie (Client / Tiers)</th>
                <th className="py-3 px-3 text-right">Prix</th>
                <th className="py-3 px-3">Règlement</th>
                <th className="py-3 px-3">Réf Pièce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredEntries.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-amber-800">
                    #{row.orderNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {formatDateOnly(row.date)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.movementType === "ACHAT" || row.movementType === "RACHAT_OR"
                          ? "bg-amber-50 text-amber-900 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {row.movementType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-900 max-w-xs truncate">
                    {row.natureOfGoods}
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {row.metalAndFineness}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {formatWeight(row.grossWeightGrams)}
                  </td>
                  <td className="py-3 px-4 font-sans max-w-xs">
                    <span className="font-semibold block truncate text-slate-900">{row.partyName}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{row.partyAddress}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                    {row.sellingPrice
                      ? formatCurrency(row.sellingPrice)
                      : row.purchasePrice
                      ? formatCurrency(row.purchasePrice)
                      : "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[10px] whitespace-nowrap">
                    {row.paymentMethod}
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {row.invoiceOrContractRef}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
