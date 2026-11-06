import { useState } from "react";
import { CreditCard, Banknote, Gift, Check, Trash2, AlertCircle, Sparkles, Building } from "lucide-react";
import { usePosStore } from "../../store/usePosStore";
import { useHardwareStore } from "../../store/useHardwareStore";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
import { formatCurrency } from "@erp-bijoux/shared-ui";
import confetti from "canvas-confetti";

export function PaymentModal() {
  const {
    isPaymentModalOpen,
    closePaymentModal,
    payments,
    addPayment,
    removePayment,
    getTotalTTC,
    getTotalPaid,
    getRemainingBalance,
    getChangeDue,
    finalizeSale,
  } = usePosStore();

  const { triggerTpePayment, tpeStatus, tpeAuthCode, openCashDrawer, resetTpeStatus } = useHardwareStore();
  const { currentSeller } = useUserStore();

  const [selectedMethod, setSelectedMethod] = useState<"CB_TPE" | "ESPECES" | "AVOIR" | "VIREMENT">("CB_TPE");
  const [cashInputValue, setCashInputValue] = useState<string>("");
  const [cashError, setCashError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const remaining = getRemainingBalance();
  const totalTTC = getTotalTTC();
  const totalPaid = getTotalPaid();
  const changeDue = getChangeDue();

  // Handle CB TPE Payment
  const handleTriggerTpe = async () => {
    if (remaining <= 0) return;
    setIsProcessing(true);
    const amountCents = Math.round(remaining * 100);
    const res = await triggerTpePayment(amountCents);
    setIsProcessing(false);

    if (res.success) {
      addPayment({
        method: "CB_TPE",
        amount: remaining,
        authorizationCode: res.authCode,
        reference: `TPE-${res.authCode}`,
      });
    }
  };

  // Handle Cash Payment with 1000€ French legal threshold
  const handleAddCash = (amountToAdd: number) => {
    setCashError(null);
    const currentCashTotal = payments
      .filter((p) => p.method === "ESPECES")
      .reduce((sum, p) => sum + p.amount, 0);

    if (currentCashTotal + amountToAdd > 1000) {
      setCashError(
        `Dépassement du plafond légal espèces de 1 000 € (Art. L112-6 du Code Monétaire et Financier). Solde espèces actuel : ${formatCurrency(
          currentCashTotal
        )}.`
      );
      return;
    }

    const ok = addPayment({
      method: "ESPECES",
      amount: amountToAdd,
      reference: "Espèces comptoir",
    });

    if (ok) {
      openCashDrawer();
      setCashInputValue("");
    }
  };

  const handleCashNumPadPress = (char: string) => {
    setCashError(null);
    if (char === "C") {
      setCashInputValue("");
      return;
    }
    if (char === "." && cashInputValue.includes(".")) {
      return;
    }
    setCashInputValue((prev) => prev + char);
  };

  const handleApplyCashInput = () => {
    const val = parseFloat(cashInputValue);
    if (!val || val <= 0) return;
    handleAddCash(val);
  };

  // Finalize Sale
  const handleCompleteSale = async () => {
    if (remaining > 0) return;
    setIsProcessing(true);
    try {
      await finalizeSale(currentSeller.id, currentSeller.name);
      resetTpeStatus();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isPaymentModalOpen) return null;

  return (
    <Modal
      isOpen={isPaymentModalOpen}
      onClose={closePaymentModal}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <CreditCard className="w-5 h-5 text-amber-600" />
          <span>Encaissement & Multi-Règlements Joaillerie</span>
        </div>
      }
      description={`Total vente : ${formatCurrency(totalTTC)} • Reste à percevoir : ${formatCurrency(remaining)}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total TTC</span>
            <span className="text-lg font-black text-slate-900 font-mono">{formatCurrency(totalTTC)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Déjà Réglé</span>
            <span className="text-lg font-black text-emerald-700 font-mono">{formatCurrency(totalPaid)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Reste Dû</span>
            <span
              className={`text-lg font-black font-mono ${
                remaining > 0 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        {/* Change due alert if cash paid > total */}
        {changeDue > 0 && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <Banknote className="w-6 h-6 text-emerald-600" />
              <div>
                <span className="text-xs text-emerald-800 font-semibold block">Monnaie à rendre au client :</span>
                <span className="text-2xl font-black text-emerald-900 font-mono">{formatCurrency(changeDue)}</span>
              </div>
            </div>
            <button
              onClick={openCashDrawer}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Tiroir (F9)
            </button>
          </div>
        )}

        {/* Already entered payments list */}
        {payments.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">Règlements enregistrés pour ce ticket :</span>
            <div className="space-y-1.5">
              {payments.map((p, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    {p.method === "CB_TPE" && <CreditCard className="w-4 h-4 text-sky-600" />}
                    {p.method === "ESPECES" && <Banknote className="w-4 h-4 text-emerald-600" />}
                    {p.method === "AVOIR" && <Gift className="w-4 h-4 text-purple-600" />}
                    {p.method === "VIREMENT" && <Building className="w-4 h-4 text-amber-600" />}
                    <span className="font-bold text-slate-800">{p.method.replace("_", " ")}</span>
                    {p.authorizationCode && (
                      <span className="text-[10px] text-slate-400 font-mono">({p.authorizationCode})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                    <button
                      onClick={() => removePayment(index)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Method selector tabs */}
        {remaining > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod("CB_TPE")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all shadow-xs ${
                  selectedMethod === "CB_TPE"
                    ? "bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-5 h-5 text-sky-600" />
                <span>CB TPE</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("ESPECES")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all shadow-xs ${
                  selectedMethod === "ESPECES"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("AVOIR")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all shadow-xs ${
                  selectedMethod === "AVOIR"
                    ? "bg-purple-50 border-purple-400 text-purple-900 ring-2 ring-purple-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Gift className="w-5 h-5 text-purple-600" />
                <span>Avoir / Bon</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("VIREMENT")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all shadow-xs ${
                  selectedMethod === "VIREMENT"
                    ? "bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building className="w-5 h-5 text-amber-600" />
                <span>Virement</span>
              </button>
            </div>

            {/* CB TPE Panel */}
            {selectedMethod === "CB_TPE" && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <CreditCard className="w-8 h-8 text-sky-600" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Déclencher transaction TPE : {formatCurrency(remaining)}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Envoi du montant sur le terminal bancaire via protocole Concert / IP
                  </p>
                </div>

                {tpeStatus === "PROCESSING" || tpeStatus === "WAITING_INSERTION" ? (
                  <div className="bg-sky-50 border border-sky-300 p-4 rounded-xl text-sky-900 text-sm font-semibold flex items-center justify-center gap-3 animate-pulse">
                    <span>Veuillez insérer ou présenter la carte sur le TPE...</span>
                  </div>
                ) : tpeStatus === "APPROVED" ? (
                  <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-900 text-sm font-semibold flex items-center justify-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Transaction Approuvée ! Code: {tpeAuthCode}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleTriggerTpe}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Lancer le paiement TPE ({formatCurrency(remaining)})</span>
                  </button>
                )}
              </div>
            )}

            {/* Espèces Panel */}
            {selectedMethod === "ESPECES" && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                {/* Legal ceiling note */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Plafond légal 1 000 € :</strong> Conformément à l'Article L112-6 du Code Monétaire et
                    Financier, le montant payé en espèces ne peut excéder 1 000 € par acte d'achat.
                  </span>
                </div>

                {cashError && (
                  <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl text-rose-800 text-xs font-semibold">
                    {cashError}
                  </div>
                )}

                {/* Quick Bills Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddCash(Math.min(1000, remaining))}
                    className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold truncate shadow-xs"
                  >
                    Montant exact
                  </button>
                  {[10, 20, 50, 100, 200].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleAddCash(bill)}
                      className="py-2.5 px-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold shadow-xs"
                    >
                      Billet {bill} €
                    </button>
                  ))}
                </div>

                {/* Oversized Touch Numpad for cash input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      placeholder="Montant reçu..."
                      value={cashInputValue ? `${cashInputValue} €` : ""}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-slate-900 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCashInput}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-xs"
                    >
                      Encaisser
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "."].map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleCashNumPadPress(char)}
                        className={`h-11 rounded-xl text-base font-bold transition-all shadow-xs ${
                          char === "C"
                            ? "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                            : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 active:scale-95"
                        }`}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Avoir / Voucher Panel */}
            {selectedMethod === "AVOIR" && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800">Enregistrer un bon d'achat ou avoir client</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Montant du bon d'achat..."
                    defaultValue={Math.min(50, remaining)}
                    id="voucherInput"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("voucherInput") as HTMLInputElement;
                      const val = parseFloat(input?.value || "0");
                      if (val > 0) {
                        addPayment({
                          method: "AVOIR",
                          amount: Math.min(val, remaining),
                          reference: "Avoir client boutique",
                        });
                      }
                    }}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-xs"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}

            {/* Virement Panel */}
            {selectedMethod === "VIREMENT" && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-center">
                <span className="text-xs font-bold text-slate-800">
                  Règlement par Virement Bancaire Immédiat ou Chèque Certifié
                </span>
                <p className="text-xs text-slate-500">
                  Idéal pour pièces de Haute Joaillerie excédant les plafonds CB / Espèces.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    addPayment({
                      method: "VIREMENT",
                      amount: remaining,
                      reference: `VIR-${Date.now().toString().slice(-6)}`,
                    });
                  }}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-xs"
                >
                  Confirmer le virement pour {formatCurrency(remaining)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Complete sale button */}
        {remaining <= 0 && (
          <div className="pt-2">
            <button
              onClick={handleCompleteSale}
              disabled={isProcessing}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-black text-base rounded-2xl shadow-sm flex items-center justify-center gap-3 active:scale-[0.99] transition-all"
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span>Finaliser la Vente & Imprimer Ticket (F12)</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
