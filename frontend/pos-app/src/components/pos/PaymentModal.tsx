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
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" />
          <span>Encaissement & Multi-Règlements Joaillerie</span>
        </div>
      }
      description={`Total vente : ${formatCurrency(totalTTC)} • Reste à percevoir : ${formatCurrency(remaining)}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[11px] text-slate-400 block">Total TTC</span>
            <span className="text-lg font-black text-slate-100">{formatCurrency(totalTTC)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Déjà Réglé</span>
            <span className="text-lg font-black text-emerald-400">{formatCurrency(totalPaid)}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Reste Dû</span>
            <span className={`text-lg font-black ${remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        {/* Change due alert if cash paid > total */}
        {changeDue > 0 && (
          <div className="bg-emerald-950/60 border border-emerald-600/50 p-4 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Banknote className="w-6 h-6 text-emerald-400" />
              <div>
                <span className="text-xs text-emerald-300 font-semibold block">Monnaie à rendre au client :</span>
                <span className="text-2xl font-black text-emerald-200">{formatCurrency(changeDue)}</span>
              </div>
            </div>
            <button
              onClick={openCashDrawer}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              Tiroir (F9)
            </button>
          </div>
        )}

        {/* Already entered payments list */}
        {payments.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Règlements enregistrés pour ce ticket :</span>
            <div className="space-y-1.5">
              {payments.map((p, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {p.method === "CB_TPE" && <CreditCard className="w-4 h-4 text-sky-400" />}
                    {p.method === "ESPECES" && <Banknote className="w-4 h-4 text-emerald-400" />}
                    {p.method === "AVOIR" && <Gift className="w-4 h-4 text-purple-400" />}
                    {p.method === "VIREMENT" && <Building className="w-4 h-4 text-amber-400" />}
                    <span className="font-bold text-slate-200">{p.method.replace("_", " ")}</span>
                    {p.authorizationCode && (
                      <span className="text-[10px] text-slate-400 font-mono">({p.authorizationCode})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-100">{formatCurrency(p.amount)}</span>
                    <button
                      onClick={() => removePayment(index)}
                      className="text-slate-500 hover:text-rose-400"
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
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedMethod === "CB_TPE"
                    ? "bg-sky-950/60 border-sky-500 text-sky-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <CreditCard className="w-5 h-5 text-sky-400" />
                <span>CB TPE</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("ESPECES")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedMethod === "ESPECES"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("AVOIR")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedMethod === "AVOIR"
                    ? "bg-purple-950/60 border-purple-500 text-purple-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <Gift className="w-5 h-5 text-purple-400" />
                <span>Avoir / Bon</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("VIREMENT")}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedMethod === "VIREMENT"
                    ? "bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <Building className="w-5 h-5 text-amber-400" />
                <span>Virement</span>
              </button>
            </div>

            {/* CB TPE Panel */}
            {selectedMethod === "CB_TPE" && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-sky-400" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-100">
                    Déclencher transaction TPE : {formatCurrency(remaining)}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Envoi du montant sur le terminal bancaire via protocole Concert / IP
                  </p>
                </div>

                {tpeStatus === "PROCESSING" || tpeStatus === "WAITING_INSERTION" ? (
                  <div className="bg-sky-950/40 border border-sky-700/60 p-4 rounded-xl text-sky-200 text-sm font-semibold flex items-center justify-center gap-3 animate-pulse">
                    <span>Veuillez insérer ou présenter la carte sur le TPE...</span>
                  </div>
                ) : tpeStatus === "APPROVED" ? (
                  <div className="bg-emerald-950/40 border border-emerald-700/60 p-4 rounded-xl text-emerald-200 text-sm font-semibold flex items-center justify-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>Transaction Approuvée ! Code: {tpeAuthCode}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleTriggerTpe}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2"
                  >
                    <span>Lancer le paiement TPE</span>
                  </button>
                )}
              </div>
            )}

            {/* Espèces Panel */}
            {selectedMethod === "ESPECES" && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                {/* Legal ceiling note */}
                <div className="bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Plafond légal 1 000 € :</strong> Conformément à l'Article L112-6 du Code Monétaire et
                    Financier, le montant payé en espèces ne peut excéder 1 000 € par acte d'achat.
                  </span>
                </div>

                {cashError && (
                  <div className="bg-rose-950/80 border border-rose-700 p-3 rounded-xl text-rose-200 text-xs font-semibold">
                    {cashError}
                  </div>
                )}

                {/* Quick Bills Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddCash(Math.min(1000, remaining))}
                    className="py-2.5 px-2 bg-emerald-950/80 border border-emerald-700 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-bold truncate"
                  >
                    Montant exact
                  </button>
                  {[10, 20, 50, 100, 200].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleAddCash(bill)}
                      className="py-2.5 px-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-100 rounded-xl text-xs font-bold"
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
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCashInput}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm"
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
                        className={`h-11 rounded-xl text-base font-bold transition-all ${
                          char === "C"
                            ? "bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900"
                            : "bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 active:scale-95"
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
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200">Enregistrer un bon d'achat ou avoir client</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Montant du bon d'achat..."
                    defaultValue={Math.min(50, remaining)}
                    id="voucherInput"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100"
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
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}

            {/* Virement Panel */}
            {selectedMethod === "VIREMENT" && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-center">
                <span className="text-xs font-bold text-slate-200">
                  Règlement par Virement Bancaire Immédiat ou Chèque Certifié
                </span>
                <p className="text-xs text-slate-400">
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
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-sm"
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
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-3 active:scale-[0.99] transition-all"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>Finaliser la Vente & Imprimer Ticket (F12)</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
