import { useState, useEffect } from "react";
import {
  Wrench,
  PlusCircle,
  Printer,
  ArrowRight,
  Eye,
  CheckCircle,
} from "lucide-react";
import { db, type RepairItem } from "../../db/db";
import { useUserStore } from "../../store/useUserStore";
import { JewelryInspectionCanvas, type InspectionAnnotation } from "./JewelryInspectionCanvas";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatDateOnly } from "@erp-bijoux/shared-ui";

const KANBAN_COLUMNS: Array<{
  status: RepairItem["status"];
  label: string;
  badgeClass: string;
  dotColor: string;
}> = [
  { status: "DEPOSE", label: "Déposé au comptoir", badgeClass: "bg-slate-800 text-slate-300", dotColor: "#94a3b8" },
  { status: "DIAGNOSTIC", label: "Diagnostic & Devis", badgeClass: "bg-amber-950 text-amber-300", dotColor: "#f59e0b" },
  { status: "EN_COURS", label: "Sur l'établi atelier", badgeClass: "bg-blue-950 text-blue-300", dotColor: "#3b82f6" },
  { status: "TERMINE_AU_COFFRE", label: "Prêt au coffre", badgeClass: "bg-emerald-950 text-emerald-300", dotColor: "#10b981" },
  { status: "LIVRE", label: "Restitué au client", badgeClass: "bg-purple-950 text-purple-300", dotColor: "#a855f7" },
];

export function WorkshopScreen() {
  const { storeInfo } = useUserStore();
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<RepairItem | null>(null);

  // New repair form state
  const [newCustomerName, setNewCustomerName] = useState("Camille Bernard");
  const [newCustomerPhone, setNewCustomerPhone] = useState("06 77 88 99 00");
  const [newJewelryType, setNewJewelryType] = useState<RepairItem["jewelryType"]>("bague");
  const [newBrandOrMetal, setNewBrandOrMetal] = useState("Or Jaune 18K & Saphir");
  const [newDescription, setNewDescription] = useState("Bague de fiançailles solitaire épaulé");
  const [newRepairDetails, setNewRepairDetails] = useState("Resserrage 4 griffes + mise à taille 54 vers 52");
  const [newEstimatedCost, setNewEstimatedCost] = useState<number>(65.0);
  const [newDepositPaid, setNewDepositPaid] = useState<number>(20.0);
  const [newPromisedDate, setNewPromisedDate] = useState("2026-11-15");
  const [newAnnotations, setNewAnnotations] = useState<InspectionAnnotation[]>([
    { x: 50, y: 35, type: "griffe_usee", note: "Griffe usée lâche" },
  ]);

  const loadRepairs = async () => {
    const all = await db.repairs.toArray();
    setRepairs(all);
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  // Update status in 1 click
  const handleUpdateStatus = async (ticketId: string, nextStatus: RepairItem["status"]) => {
    await db.repairs.update(ticketId, { status: nextStatus });
    await loadRepairs();
  };

  // Create new repair ticket
  const handleCreateRepair = async () => {
    const seq = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `SAV-2026-${seq}`;

    const newTicket: RepairItem = {
      id: `rep-${Date.now()}`,
      ticketNumber,
      customerId: `cust-${Date.now()}`,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      jewelryType: newJewelryType,
      brandOrMetal: newBrandOrMetal,
      description: newDescription,
      repairDetails: newRepairDetails,
      inspectionAnnotations: [...newAnnotations],
      status: "DEPOSE",
      estimatedCost: newEstimatedCost,
      depositPaid: newDepositPaid,
      promisedDate: newPromisedDate,
      createdAt: new Date().toISOString(),
    };

    await db.repairs.add(newTicket);
    await loadRepairs();
    setIsNewOrderModalOpen(false);
    setSelectedTicketForPrint(newTicket);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-950 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Atelier Joaillerie & SAV Réparations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des dépôts, bons de confié numériques et traçabilité des anomalies bijou
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-950 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Bon de Confié</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colRepairs = repairs.filter((r) => r.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-slate-900/60 rounded-2xl border border-slate-800/80 flex flex-col max-h-[75vh] overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.dotColor }} />
                  <span className="text-xs font-bold text-slate-200">{col.label}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {colRepairs.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {colRepairs.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs italic">
                    Aucun bijou dans cet état
                  </div>
                ) : (
                  colRepairs.map((repair) => (
                    <div
                      key={repair.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 space-y-2.5 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {repair.ticketNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDateOnly(repair.promisedDate)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{repair.description}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {repair.brandOrMetal}
                        </span>
                      </div>

                      <div className="bg-slate-900/70 p-2 rounded-lg text-[11px] text-slate-300">
                        {repair.repairDetails}
                      </div>

                      {/* Defects Pin Counter */}
                      {repair.inspectionAnnotations?.length > 0 && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                          <Eye className="w-3 h-3" />
                          <span>{repair.inspectionAnnotations.length} anomalie(s) marquée(s)</span>
                        </div>
                      )}

                      {/* Client & Pricing */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                        <span className="text-slate-400 truncate max-w-[100px]">{repair.customerName}</span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatCurrency(repair.estimatedCost)}
                        </span>
                      </div>

                      {/* Status Transition Action Buttons */}
                      <div className="flex items-center justify-between pt-1 gap-1">
                        <button
                          onClick={() => setSelectedTicketForPrint(repair)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-900 rounded-lg text-[10px] flex items-center gap-1"
                          title="Imprimer bon de confié"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>

                        {col.status !== "LIVRE" && (
                          <button
                            onClick={() => {
                              const currentIndex = KANBAN_COLUMNS.findIndex((c) => c.status === col.status);
                              if (currentIndex < KANBAN_COLUMNS.length - 1) {
                                handleUpdateStatus(repair.id, KANBAN_COLUMNS[currentIndex + 1].status);
                              }
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Suivant</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Repair Ticket Modal with Vector SVG Schematic */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <span>Nouveau Bon de Confié & Inspection Vectorielle</span>
          </div>
        }
        description="Enregistrez le bijou confié et marquez précisément les rayures / défauts sur le schéma"
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Customer & Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nom du Client</label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Téléphone</label>
              <input
                type="text"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Type de Pièce</label>
              <select
                value={newJewelryType}
                onChange={(e) => setNewJewelryType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="bague">Bague / Solitaire / Alliance</option>
                <option value="montre">Montre / Horlogerie</option>
                <option value="collier">Collier / Pendentif</option>
                <option value="bracelet">Bracelet / Rivière</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 font-semibold block mb-1">Désignation du Bijou</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ex: Bague Solitaire Épaulé"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 font-semibold block mb-1">Matière / Marque / Poinçon</label>
              <input
                type="text"
                value={newBrandOrMetal}
                onChange={(e) => setNewBrandOrMetal(e.target.value)}
                placeholder="Ex: Or Blanc 18K avec Saphir Ceylan 1.50ct"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Date Promise Restitution</label>
              <input
                type="date"
                value={newPromisedDate}
                onChange={(e) => setNewPromisedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-slate-300 font-semibold block mb-1">Travaux Demandés à l'Atelier</label>
              <textarea
                rows={2}
                value={newRepairDetails}
                onChange={(e) => setNewRepairDetails(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          {/* Interactive Inspection Canvas */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Inspection Visuelle & Pointage des Anomalies de Dépôt</span>
            </h4>
            <JewelryInspectionCanvas
              jewelryType={newJewelryType}
              annotations={newAnnotations}
              onChange={setNewAnnotations}
            />
          </div>

          {/* Estimated pricing & submit */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
            <div>
              <label className="text-slate-400 block mb-1">Devis Estimatif (€ TTC)</label>
              <input
                type="number"
                value={newEstimatedCost}
                onChange={(e) => setNewEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Acompte Réglé (€ TTC)</label>
              <input
                type="number"
                value={newDepositPaid}
                onChange={(e) => setNewDepositPaid(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCreateRepair}
              className="py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Créer le Bon de Confié & Imprimer Récépissé</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Repair Receipt Ticket Modal */}
      {selectedTicketForPrint && (
        <Modal
          isOpen={Boolean(selectedTicketForPrint)}
          onClose={() => setSelectedTicketForPrint(null)}
          title={`Bon de Confié ${selectedTicketForPrint.ticketNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-white text-slate-900 p-6 rounded-xl font-mono text-xs shadow-md border border-slate-300 space-y-3">
              <div className="text-center border-b pb-2">
                <h4 className="font-bold text-sm uppercase">{storeInfo.name}</h4>
                <p className="text-[10px]">RÉCÉPISSÉ DE DÉPÔT & BON DE CONFIÉ N° {selectedTicketForPrint.ticketNumber}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div>Client : {selectedTicketForPrint.customerName} ({selectedTicketForPrint.customerPhone})</div>
                <div>Pièce : {selectedTicketForPrint.brandOrMetal}</div>
                <div>Travaux : {selectedTicketForPrint.repairDetails}</div>
                <div>Date promise : {formatDateOnly(selectedTicketForPrint.promisedDate)}</div>
                <div className="font-bold">Estimation : {formatCurrency(selectedTicketForPrint.estimatedCost)} (Acompte : {formatCurrency(selectedTicketForPrint.depositPaid)})</div>
              </div>

              {selectedTicketForPrint.inspectionAnnotations.length > 0 && (
                <div className="border-t pt-2 text-[10px]">
                  <span className="font-bold block text-slate-800">Anomalies constatées au dépôt :</span>
                  {selectedTicketForPrint.inspectionAnnotations.map((a, i) => (
                    <div key={i}>
                      • {a.type.toUpperCase()} : {a.note}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-2 text-[8px] text-center text-slate-500">
                La pièce sera restituée exclusivement sur présentation de ce récépissé original.
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Bon de Confié</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
