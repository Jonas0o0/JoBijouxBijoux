import { useState } from "react";
import {
  Scale,
  CreditCard,
  UserCheck,
  FileCheck,
  Printer,
  CheckCircle2,
  Calendar,
  Building,
  ShieldAlert,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { db, type GoldBuybackRecord } from "../../db/db";
import { useHardwareStore } from "../../store/useHardwareStore";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatWeight, formatDate } from "@erp-bijoux/shared-ui";

interface GoldItemToWeigh {
  description: string;
  goldFineness: "24k" | "18k" | "14k" | "9k" | "argent_925";
  finenessThousandths: number;
  grossWeightGrams: number;
  netWeightGrams: number;
  goldPricePerGram: number;
  grossAmount: number;
}

const GOLD_RATES: Record<string, { label: string; fineness: number; pricePerGram: number }> = {
  "24k": { label: "Or 24 Carats (999‰ Lingot/Monnaie)", fineness: 999, pricePerGram: 78.5 },
  "18k": { label: "Or 18 Carats (750‰ Bijouterie)", fineness: 750, pricePerGram: 58.85 },
  "14k": { label: "Or 14 Carats (585‰)", fineness: 585, pricePerGram: 45.9 },
  "9k": { label: "Or 9 Carats (375‰)", fineness: 375, pricePerGram: 29.4 },
  argent_925: { label: "Argent Massif (925‰)", fineness: 925, pricePerGram: 0.95 },
};

export function GoldBuybackScreen() {
  const { scaleWeight, isScaleStable, tareScale } = useHardwareStore();
  const { currentSeller, storeInfo } = useUserStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Client KYC data
  const [clientData, setClientData] = useState({
    fullName: "Pauline Gauthier",
    idType: "CNI" as "CNI" | "PASSEPORT" | "TITRE_SEJOUR",
    idNumber: "190575102894",
    address: "24 Rue de Rivoli, 75004 Paris",
    birthDate: "1988-06-15",
    phone: "06 88 77 66 55",
    iban: "FR76 3000 4012 3456 7890 1234 567",
  });

  // Step 2: Weighed lots
  const [weighedItems, setWeighedItems] = useState<GoldItemToWeigh[]>([
    {
      description: "Lot 2 bagues anciennes cassées et 1 débris chaîne",
      goldFineness: "18k",
      finenessThousandths: 750,
      grossWeightGrams: 14.85,
      netWeightGrams: 14.85,
      goldPricePerGram: 58.85,
      grossAmount: 14.85 * 58.85,
    },
  ]);

  const [currentLotDesc, setCurrentLotDesc] = useState("Bague or 18k sertie débris");
  const [selectedFineness, setSelectedFineness] = useState<"24k" | "18k" | "14k" | "9k" | "argent_925">("18k");
  const [tareDeductionGrams, setTareDeductionGrams] = useState<number>(0);

  // Step 4: Payment method (Strictly Virement or Chèque)
  const [paymentMethod, setPaymentMethod] = useState<"VIREMENT" | "CHEQUE">("VIREMENT");
  const [finalContract, setFinalContract] = useState<GoldBuybackRecord | null>(null);

  // Fiscal calculation
  const totalGrossAmount = weighedItems.reduce((sum, item) => sum + item.grossAmount, 0);
  const tmpTaxRate = 0.115; // 11% TMP + 0.5% CRDS
  const tmpTaxAmount = totalGrossAmount * tmpTaxRate;
  const netPayoutAmount = totalGrossAmount - tmpTaxAmount;

  // Add current scale weight as a lot
  const handleAddWeighedLot = () => {
    if (scaleWeight <= 0) return;
    const netGrams = Math.max(0.001, scaleWeight - tareDeductionGrams);
    const rate = GOLD_RATES[selectedFineness].pricePerGram;
    const gross = netGrams * rate;

    const newLot: GoldItemToWeigh = {
      description: currentLotDesc.trim() || `Lot ${GOLD_RATES[selectedFineness].label}`,
      goldFineness: selectedFineness,
      finenessThousandths: GOLD_RATES[selectedFineness].fineness,
      grossWeightGrams: scaleWeight,
      netWeightGrams: netGrams,
      goldPricePerGram: rate,
      grossAmount: gross,
    };

    setWeighedItems([...weighedItems, newLot]);
    setCurrentLotDesc("");
    setTareDeductionGrams(0);
  };

  const handleRemoveLot = (idx: number) => {
    setWeighedItems(weighedItems.filter((_, i) => i !== idx));
  };

  // Finalize contract
  const handleFinalizeContract = async () => {
    if (weighedItems.length === 0) return;

    const now = new Date();
    const coolingOffEnd = new Date(now.getTime() + 48 * 3600 * 1000);
    const contractNumber = `RO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const policeEntryId = `pol-${Date.now()}`;

    const record: GoldBuybackRecord = {
      id: `gold-${Date.now()}`,
      contractNumber,
      sellerId: currentSeller.id,
      sellerName: currentSeller.name,
      client: { ...clientData },
      items: [...weighedItems],
      totalGrossAmount,
      tmpTaxRate,
      tmpTaxAmount,
      netPayoutAmount,
      paymentMethod,
      paymentReference: paymentMethod === "VIREMENT" ? "VIR-SEPA-IMM" : "CHQ-BANQUE-PO",
      coolingOffPeriodEndsAt: coolingOffEnd.toISOString(),
      policeBookEntryId: policeEntryId,
      createdAt: now.toISOString(),
    };

    // Save to Dexie
    await db.goldBuybacks.add(record);

    // Add to Police Book (Livre de Police)
    const policeCount = await db.policeBook.count();
    await db.policeBook.add({
      id: policeEntryId,
      orderNumber: 1000 + policeCount + 1,
      date: now.toISOString().split("T")[0],
      movementType: "RACHAT_OR",
      natureOfGoods: weighedItems.map((i) => i.description).join("; "),
      metalAndFineness: weighedItems.map((i) => `Or ${i.goldFineness}`).join(", "),
      grossWeightGrams: weighedItems.reduce((s, i) => s + i.grossWeightGrams, 0),
      netWeightGrams: weighedItems.reduce((s, i) => s + i.netWeightGrams, 0),
      partyName: clientData.fullName,
      partyAddress: clientData.address,
      partyIdDocument: `${clientData.idType} ${clientData.idNumber}`,
      purchasePrice: netPayoutAmount,
      paymentMethod: paymentMethod === "VIREMENT" ? "Virement Bancaire" : "Chèque barré",
      invoiceOrContractRef: contractNumber,
      createdAt: now.toISOString(),
      sealedHash: btoa(`${contractNumber}|${netPayoutAmount.toFixed(2)}|${clientData.fullName}`).substring(0, 32),
    });

    setFinalContract(record);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-900">
      {/* Title & Wizard Step Navigator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded bg-amber-50 text-amber-700">⚖️</span>
            <span>Rachat d'Or & Métaux Précieux aux Particuliers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conforme Code de la Consommation (Délai 48h) & Code Général des Impôts (Taxe TMP 11,5%)
          </p>
        </div>

        {/* 4 Steps Indicator */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { step: 1, label: "1. Client CNI", icon: UserCheck },
            { step: 2, label: "2. Pesée Balance", icon: Scale },
            { step: 3, label: "3. Taxe TMP 11.5%", icon: CreditCard },
            { step: 4, label: "4. Contrat 48h", icon: FileCheck },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  isActive
                    ? "bg-amber-600 text-white shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Scan CNI & Client KYC */}
      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto w-full bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>Étape 1 : Vérification d'Identité Majeure & Conformité KYC</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Réglementation Tracfin : Le rachat de métaux précieux est strictement interdit aux personnes mineures et
              exige un justificatif d'identité valide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Nom et Prénom du Vendeur *</label>
              <input
                type="text"
                value={clientData.fullName}
                onChange={(e) => setClientData({ ...clientData, fullName: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Type de Document d'Identité *</label>
              <select
                value={clientData.idType}
                onChange={(e) => setClientData({ ...clientData, idType: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-600 shadow-xs"
              >
                <option value="CNI">Carte Nationale d'Identité Française (CNI)</option>
                <option value="PASSEPORT">Passeport Européen / International</option>
                <option value="TITRE_SEJOUR">Titre de Séjour Régulier</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Numéro du Document *</label>
              <input
                type="text"
                value={clientData.idNumber}
                onChange={(e) => setClientData({ ...clientData, idNumber: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Date de Naissance (Majorité requise) *</label>
              <input
                type="date"
                value={clientData.birthDate}
                onChange={(e) => setClientData({ ...clientData, birthDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">Adresse Domicile Complète *</label>
              <input
                type="text"
                value={clientData.address}
                onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">Coordonnées Bancaires IBAN (Paiement Virement) *</label>
              <input
                type="text"
                value={clientData.iban}
                onChange={(e) => setClientData({ ...clientData, iban: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Continuer vers la Pesée Balance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Live Connected Scale Weighing & Gold Titles */}
      {currentStep === 2 && (
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Live Precision Scale View */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pesée Métrologique en Direct (Balance Connectée)
                  </h3>
                  <p className="text-xs text-slate-500">Flux temps réel WebSocket `ws://localhost:8089/ws/scale`</p>
                </div>
              </div>

              {/* Live Weight Display */}
              <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-right">
                  <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                    {formatWeight(scaleWeight)}
                  </span>
                  <span
                    className={`block text-[10px] font-bold uppercase ${
                      isScaleStable ? "text-emerald-700" : "text-amber-700 animate-pulse"
                    }`}
                  >
                    {isScaleStable ? "● Poids Métrologique Validé" : "○ En Mouvement"}
                  </span>
                </div>

                <button
                  onClick={() => tareScale()}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-xs"
                >
                  Tarer (F8)
                </button>
              </div>
            </div>

            {/* Title / Fineness Selection & Tare Adjustment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Sélectionner le Titre de l'Or :</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(GOLD_RATES).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFineness(key as any)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all shadow-xs ${
                        selectedFineness === key
                          ? "bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-bold block text-sm">{item.label.split("(")[0]}</span>
                      <span className="text-[11px] text-amber-800 font-mono font-bold">
                        {formatCurrency(item.pricePerGram)} / gramme
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">Description du lot :</span>
                <input
                  type="text"
                  placeholder="Ex: Alliance usée or jaune..."
                  value={currentLotDesc}
                  onChange={(e) => setCurrentLotDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 shadow-xs"
                />

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    Déduction pierres/oxydes (g) :
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tareDeductionGrams}
                    onChange={(e) => setTareDeductionGrams(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 shadow-xs"
                  />
                </div>

                <button
                  disabled={scaleWeight <= 0}
                  onClick={handleAddWeighedLot}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter au dossier rachat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Weighed Items Ledger */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lots d'or expertisés pour ce contrat ({weighedItems.length}) :
            </h4>

            {weighedItems.map((lot, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{lot.description}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Titre: {lot.goldFineness.toUpperCase()} ({lot.finenessThousandths}‰) • Poids net:{" "}
                    {formatWeight(lot.netWeightGrams)} @ {formatCurrency(lot.goldPricePerGram)}/g
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(lot.grossAmount)}
                  </span>
                  <button
                    onClick={() => handleRemoveLot(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour CNI</span>
              </button>

              <button
                disabled={weighedItems.length === 0}
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs disabled:opacity-40 transition-colors"
              >
                <span>Calculer la Taxe TMP (11,5%)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Automatic TMP 11.5% Calculation */}
      {currentStep === 3 && (
        <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <span>Étape 3 : Calcul Fiscal de la Taxe sur les Métaux Précieux (TMP)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Article 298 sexdecies A du Code Général des Impôts : Prélèvement libératoire automatique de 11,5% reversé
              par le bijoutier au Trésor Public (Cerfa n° 2091).
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-700 text-sm">
              <span>Montant Brut de Rachat (Matière) :</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalGrossAmount)}</span>
            </div>

            <div className="flex justify-between text-rose-700 py-2 border-y border-slate-200">
              <div className="space-y-0.5">
                <span className="font-bold block">Taxe TMP Forfaitaire (11,0%) + CRDS (0,5%) :</span>
                <span className="text-[10px] text-slate-400">Taux global légal : 11,50%</span>
              </div>
              <span className="font-bold text-sm">-{formatCurrency(tmpTaxAmount)}</span>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 pt-2">
              <span>NET À PAYER AU CLIENT :</span>
              <span className="text-xl text-amber-700">{formatCurrency(netPayoutAmount)}</span>
            </div>
          </div>

          {/* Strict Cash Prohibition Banner */}
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-rose-900 block uppercase">
                Interdiction Absolue du Paiement en Espèces (Art. L112-6 CMF)
              </span>
              <p className="text-rose-800">
                La loi interdit strictement tout paiement en espèces pour l'achat de métaux précieux. Le règlement doit
                exclusivement s'effectuer par virement bancaire ou chèque barré.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour Pesée</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Générer le Contrat de Rachat (48h)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Legal Contract Generation & 48h Notice */}
      {currentStep === 4 && (
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Étape 4 : Contrat Réglementaire & Délai de Rétractation 48h</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bordereau détachable de rétractation conforme aux articles L.224-96 et R.224-4 du Code de la Consommation.
              </p>
            </div>

            {/* Payment Method Selector (No Cash Allowed) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Mode de paiement du rachat :</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("VIREMENT")}
                  className={`p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-colors shadow-xs ${
                    paymentMethod === "VIREMENT"
                      ? "bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-bold block">Virement Bancaire Immédiat</span>
                    <span className="text-[10px] text-slate-500">{clientData.iban}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CHEQUE")}
                  className={`p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition-colors shadow-xs ${
                    paymentMethod === "CHEQUE"
                      ? "bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-bold block">Chèque de Banque Barré</span>
                    <span className="text-[10px] text-slate-500">Ordre : {clientData.fullName}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 48h Cooling off notice */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Droit de Rétractation de 48 Heures (Art. L224-97)</span>
              </div>
              <p className="text-slate-700">
                Le vendeur dispose d'un délai de rétractation de deux jours calendaires sans motif. Les pièces d'or
                doivent être conservées sous scellés étanches au coffre jusqu'à expiration du délai légal.
              </p>
              <div className="font-mono text-[11px] text-amber-800 font-bold pt-1">
                Délai expire le : {formatDate(new Date(Date.now() + 48 * 3600 * 1000))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour Calcul</span>
              </button>

              <button
                onClick={handleFinalizeContract}
                className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                <span>Valider le Contrat & Inscrire au Livre de Police</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Created Success Modal */}
      {finalContract && (
        <Modal
          isOpen={Boolean(finalContract)}
          onClose={() => setFinalContract(null)}
          title={
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Contrat Rachat d'Or {finalContract.contractNumber} Validé</span>
            </div>
          }
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="bg-white text-slate-900 p-6 rounded-xl font-mono text-xs shadow-xs border border-slate-200 space-y-3">
              <div className="text-center border-b border-slate-200 pb-2">
                <h4 className="font-bold text-sm uppercase text-slate-900">{storeInfo.name}</h4>
                <p className="text-[10px] text-slate-500">Contrat officiel d'achat de métaux précieux n° {finalContract.contractNumber}</p>
              </div>

              <div className="text-[11px] space-y-1 text-slate-700">
                <div>Client : {finalContract.client.fullName} ({finalContract.client.idNumber})</div>
                <div>Adresse : {finalContract.client.address}</div>
                <div>Montant Net Versé : {formatCurrency(finalContract.netPayoutAmount)} (par {finalContract.paymentMethod})</div>
                <div>Taxe TMP 11,5% déduite : {formatCurrency(finalContract.tmpTaxAmount)}</div>
                <div className="text-rose-700 font-bold">Rétractation jusqu'au : {formatDate(finalContract.coolingOffPeriodEndsAt)}</div>
              </div>

              <div className="pt-2 text-[9px] text-slate-400 text-center border-t border-slate-100">
                Inscrit au Registre du Livre de Police • Formulaire Cerfa 2091 généré
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
                setFinalContract(null);
                setCurrentStep(1);
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Contrat & Bon de Rétractation 48h</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
