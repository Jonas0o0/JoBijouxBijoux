import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
  Edit2,
  UserCheck,
  Hand,
} from "lucide-react";
import { db, type CustomerRecord, type FingerSizeRecord } from "../../db/db";
import { usePosStore } from "../../store/usePosStore";
import { Modal, Badge, Button, Input } from "@erp-bijoux/shared-ui";
import { formatCurrency, formatDateOnly } from "@erp-bijoux/shared-ui";

interface CustomerCrmScreenProps {
  onNavigateToPos?: () => void;
}

const FINGER_DEFINITIONS: Array<{ id: string; label: string; hand: "gauche" | "droite" }> = [
  { id: "pouce_g", label: "Pouce", hand: "gauche" },
  { id: "index_g", label: "Index", hand: "gauche" },
  { id: "majeur_g", label: "Majeur", hand: "gauche" },
  { id: "annulaire_g", label: "Annulaire (Alliance)", hand: "gauche" },
  { id: "auriculaire_g", label: "Auriculaire", hand: "gauche" },
  { id: "pouce_d", label: "Pouce", hand: "droite" },
  { id: "index_d", label: "Index", hand: "droite" },
  { id: "majeur_d", label: "Majeur", hand: "droite" },
  { id: "annulaire_d", label: "Annulaire", hand: "droite" },
  { id: "auriculaire_d", label: "Auriculaire", hand: "droite" },
];

export function CustomerCrmScreen({ onNavigateToPos }: CustomerCrmScreenProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipFilter, setVipFilter] = useState<string>("ALL");
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isEditBaguierModalOpen, setIsEditBaguierModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New customer form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newVipTier, setNewVipTier] = useState<"STANDARD" | "PRESTIGE" | "HAUTE_JOAILLERIE">("STANDARD");
  const [newAnniversary, setNewAnniversary] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPreferences, setNewPreferences] = useState("");

  // Quick edit ring sizes form state
  const [editingFingerSizes, setEditingFingerSizes] = useState<Record<string, number>>({});

  const { setCustomer, customer: activePosCustomer } = usePosStore();

  const loadCustomers = async () => {
    const all = await db.customers.toArray();
    setCustomers(all);
    if (!selectedCustomerId && all.length > 0) {
      setSelectedCustomerId(all[0].id);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Notification auto-dismiss
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesVip = vipFilter === "ALL" || c.vipTier === vipFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q);
      return matchesVip && matchesSearch;
    });
  }, [customers, vipFilter, searchQuery]);

  // Handle select for active POS cart
  const handleSelectForPos = (cust: CustomerRecord) => {
    setCustomer({
      id: cust.id,
      name: `${cust.firstName} ${cust.lastName}`,
      phone: cust.phone,
      email: cust.email,
      hasVoucher: cust.voucherAmount > 0,
      voucherAmount: cust.voucherAmount,
    });
    setNotification(`Client ${cust.firstName} ${cust.lastName} lié au panier en cours !`);
  };

  // Create new customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLastName.trim() || !newFirstName.trim()) return;

    const newCust: CustomerRecord = {
      id: `cust-${Date.now()}`,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      address: newAddress.trim() || undefined,
      vipTier: newVipTier,
      anniversaryDate: newAnniversary.trim() || undefined,
      notes: newNotes.trim() || undefined,
      preferences: newPreferences.trim() || undefined,
      fingerSizes: [],
      totalSpent: 0,
      ordersCount: 0,
      voucherAmount: 0,
      createdAt: new Date().toISOString(),
    };

    await db.customers.add(newCust);
    await loadCustomers();
    setSelectedCustomerId(newCust.id);
    setIsNewCustomerModalOpen(false);

    // Reset form
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("");
    setNewEmail("");
    setNewAddress("");
    setNewAnniversary("");
    setNewNotes("");
    setNewPreferences("");
    setNotification(`Fiche client créée avec succès pour ${newCust.firstName} ${newCust.lastName}`);
  };

  // Open Baguier editor
  const handleOpenBaguierEditor = (cust: CustomerRecord) => {
    const sizeMap: Record<string, number> = {};
    cust.fingerSizes.forEach((f) => {
      sizeMap[f.finger] = f.size;
    });
    setEditingFingerSizes(sizeMap);
    setIsEditBaguierModalOpen(true);
  };

  // Save Baguier
  const handleSaveBaguier = async () => {
    if (!selectedCustomer) return;

    const updatedSizes: FingerSizeRecord[] = [];
    Object.entries(editingFingerSizes).forEach(([fingerKey, sizeVal]) => {
      if (sizeVal && sizeVal > 0) {
        const def = FINGER_DEFINITIONS.find((d) => d.id === fingerKey);
        updatedSizes.push({
          finger: fingerKey,
          fingerLabel: def ? def.label : fingerKey,
          hand: def ? def.hand : "gauche",
          size: sizeVal,
          measuredAt: new Date().toISOString().slice(0, 10),
        });
      }
    });

    await db.customers.update(selectedCustomer.id, {
      fingerSizes: updatedSizes,
    });

    await loadCustomers();
    setIsEditBaguierModalOpen(false);
    setNotification("Baguier client mis à jour avec succès");
  };

  // Quick stats
  const totalSpentAll = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalSpent, 0);
  }, [customers]);

  const vipCount = useMemo(() => {
    return customers.filter((c) => c.vipTier === "HAUTE_JOAILLERIE" || c.vipTier === "PRESTIGE").length;
  }, [customers]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200/90 shadow-xl text-xs font-semibold text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
          {onNavigateToPos && (
            <button
              onClick={onNavigateToPos}
              className="ml-2 text-amber-700 underline font-bold hover:text-amber-800"
            >
              Aller en Caisse
            </button>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
              <Users className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Fichier Clients & Baguier Joaillerie</span>
                <Badge variant="outline" className="text-[11px] font-mono text-slate-500">
                  {customers.length} fiches
                </Badge>
              </h1>
              <p className="text-xs text-slate-500">
                Tailles de doigts personnalisées • Historique d'achats • Avoirs & Privilèges VIP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Dépenses Clients</div>
                <div className="text-xs font-bold font-mono text-slate-900">{formatCurrency(totalSpentAll)}</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Membres VIP</div>
                <div className="text-xs font-bold font-mono text-slate-900">{vipCount} fiches</div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left List / Right Details */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Customer List Sidebar */}
        <div className="w-80 md:w-96 border-r border-slate-200/80 bg-white flex flex-col h-full">
          {/* Search & Filters */}
          <div className="p-3.5 border-b border-slate-100 space-y-2">
            <Input
              placeholder="Rechercher nom, téléphone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="h-9 text-xs"
            />

            <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
              {["ALL", "STANDARD", "PRESTIGE", "HAUTE_JOAILLERIE"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setVipFilter(tier)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    vipFilter === tier
                      ? "bg-slate-900 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {tier === "ALL" ? "Tous" : tier === "HAUTE_JOAILLERIE" ? "Haute Joaillerie" : tier}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Aucun client ne correspond à la recherche.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                const isPosActive = activePosCustomer?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50/70 border-l-4 border-amber-600"
                        : "hover:bg-slate-50/80 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>
                            {c.firstName} {c.lastName}
                          </span>
                          {isPosActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Actif en caisse" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.phone}</div>
                      </div>

                      {c.vipTier === "HAUTE_JOAILLERIE" ? (
                        <Badge variant="gold" size="sm">
                          Haute Joaillerie
                        </Badge>
                      ) : c.vipTier === "PRESTIGE" ? (
                        <Badge variant="warning" size="sm">
                          Prestige
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{c.fingerSizes.length} taille(s) baguier</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(c.totalSpent)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Customer Full Profile & Baguier Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedCustomer ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Profile Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white font-bold text-xl shadow-xs">
                      {selectedCustomer.firstName[0]}
                      {selectedCustomer.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </h2>
                        {selectedCustomer.vipTier === "HAUTE_JOAILLERIE" ? (
                          <Badge variant="gold">Membre Haute Joaillerie</Badge>
                        ) : selectedCustomer.vipTier === "PRESTIGE" ? (
                          <Badge variant="warning">Client Prestige</Badge>
                        ) : (
                          <Badge variant="default">Client Standard</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{selectedCustomer.phone}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedCustomer.email}</span>
                        </span>
                        {selectedCustomer.address && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{selectedCustomer.address}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Profile Action: Attach to POS Cart */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleSelectForPos(selectedCustomer)}
                      className="gap-2 text-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Sélectionner pour la Caisse en cours</span>
                    </Button>
                  </div>
                </div>

                {/* Financial Summary Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[11px] text-slate-400 block font-medium">Total Dépensé</span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedCustomer.ordersCount} achat(s) enregistrés
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[11px] text-slate-400 block font-medium">Avoir Disponible</span>
                    <span
                      className={`text-base font-black font-mono ${
                        selectedCustomer.voucherAmount > 0 ? "text-emerald-700" : "text-slate-700"
                      }`}
                    >
                      {formatCurrency(selectedCustomer.voucherAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Utilisable immédiatement en caisse</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[11px] text-slate-400 block font-medium">Anniversaire / Mariage</span>
                    <span className="text-sm font-bold text-slate-800 block">
                      {selectedCustomer.anniversaryDate || "Non renseigné"}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Alerte conseil cadeau</span>
                  </div>
                </div>
              </div>

              {/* BAGUIER VISUEL ET INTERACTIF */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      <Hand className="w-4 h-4 text-amber-600" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Baguier & Tailles de Doigts Certifiées
                      </h3>
                      <p className="text-xs text-slate-500">
                        Mesures précises pour bagues de fiançailles, alliances et chevalières
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenBaguierEditor(selectedCustomer)}
                    className="gap-1.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Mettre à jour le Baguier</span>
                  </Button>
                </div>

                {/* Hand Rings Visual Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Left Hand */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Hand className="w-3.5 h-3.5 text-amber-600" />
                        <span>Main Gauche (Côté Cœur / Alliance)</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {FINGER_DEFINITIONS.filter((f) => f.hand === "gauche").map((finger) => {
                        const existing = selectedCustomer.fingerSizes.find((s) => s.finger === finger.id);
                        return (
                          <div
                            key={finger.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                              existing
                                ? "bg-white border-amber-200/90 shadow-xs"
                                : "bg-white/60 border-slate-200/60 opacity-60"
                            }`}
                          >
                            <span className="text-xs font-medium text-slate-700">{finger.label}</span>
                            {existing ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                                  Taille {existing.size}
                                </span>
                                {existing.measuredAt && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({formatDateOnly(existing.measuredAt)})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-mono">Non mesuré</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Hand */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Hand className="w-3.5 h-3.5 text-slate-600" />
                        <span>Main Droite</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {FINGER_DEFINITIONS.filter((f) => f.hand === "droite").map((finger) => {
                        const existing = selectedCustomer.fingerSizes.find((s) => s.finger === finger.id);
                        return (
                          <div
                            key={finger.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                              existing
                                ? "bg-white border-amber-200/90 shadow-xs"
                                : "bg-white/60 border-slate-200/60 opacity-60"
                            }`}
                          >
                            <span className="text-xs font-medium text-slate-700">{finger.label}</span>
                            {existing ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                                  Taille {existing.size}
                                </span>
                                {existing.measuredAt && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({formatDateOnly(existing.measuredAt)})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-mono">Non mesuré</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Additional Morpho Metrics: Poignet & Chaîne */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Tour de Poignet :</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedCustomer.wristSizeCm ? `${selectedCustomer.wristSizeCm} cm` : "Non mesuré"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Longueur Chaîne / Collier :</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedCustomer.necklaceSizeCm ? `${selectedCustomer.necklaceSizeCm} cm` : "Non mesuré"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences & Counselor Notes */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Préférences Joaillerie & Notes Conseiller</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40">
                    <div className="text-xs font-bold text-slate-700 mb-1">Goûts & Métaux préférés</div>
                    <p className="text-xs text-slate-600">
                      {selectedCustomer.preferences || "Aucune préférence enregistrée."}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40">
                    <div className="text-xs font-bold text-slate-700 mb-1">Notes Internes de la Maison</div>
                    <p className="text-xs text-slate-600">
                      {selectedCustomer.notes || "Aucune note particulière."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Sélectionnez une fiche client</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choisissez un client dans la liste de gauche pour consulter son profil ou mettre à jour son baguier.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Customer Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            <span>Créer une Nouvelle Fiche Client Joaillerie</span>
          </div>
        }
        description="Renseignez les coordonnées et informations pour le suivi personnalisé"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Prénom *</label>
              <input
                required
                type="text"
                placeholder="Ex: Éléonore"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nom *</label>
              <input
                required
                type="text"
                placeholder="Ex: de Courcelles"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Téléphone *</label>
              <input
                required
                type="tel"
                placeholder="06 12 34 56 78"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="client@domaine.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Adresse postale</label>
            <input
              type="text"
              placeholder="12 Place Vendôme, 75001 Paris"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Statut VIP</label>
              <select
                value={newVipTier}
                onChange={(e) => setNewVipTier(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              >
                <option value="STANDARD">Standard</option>
                <option value="PRESTIGE">Prestige</option>
                <option value="HAUTE_JOAILLERIE">Haute Joaillerie</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Date d'Anniversaire</label>
              <input
                type="text"
                placeholder="Ex: 24 Octobre"
                value={newAnniversary}
                onChange={(e) => setNewAnniversary(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Préférences joaillerie</label>
            <input
              type="text"
              placeholder="Ex: Or Blanc 18K, Saphirs, Alliances fines..."
              value={newPreferences}
              onChange={(e) => setNewPreferences(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCustomerModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm">
              Enregistrer le Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Baguier Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isEditBaguierModalOpen}
          onClose={() => setIsEditBaguierModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Hand className="w-5 h-5 text-amber-600" />
              <span>Mise à jour du Baguier : {selectedCustomer.firstName} {selectedCustomer.lastName}</span>
            </div>
          }
          description="Renseignez les tailles mesurées au baguier joaillier (norme française 44 à 70)"
          maxWidth="xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Hand Form */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                  Main Gauche
                </div>
                {FINGER_DEFINITIONS.filter((f) => f.hand === "gauche").map((finger) => (
                  <div key={finger.id} className="flex items-center justify-between gap-2">
                    <label className="text-xs text-slate-700 font-medium">{finger.label}</label>
                    <input
                      type="number"
                      min={40}
                      max={74}
                      placeholder="—"
                      value={editingFingerSizes[finger.id] || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingFingerSizes((prev) => ({ ...prev, [finger.id]: val }));
                      }}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                ))}
              </div>

              {/* Right Hand Form */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                  Main Droite
                </div>
                {FINGER_DEFINITIONS.filter((f) => f.hand === "droite").map((finger) => (
                  <div key={finger.id} className="flex items-center justify-between gap-2">
                    <label className="text-xs text-slate-700 font-medium">{finger.label}</label>
                    <input
                      type="number"
                      min={40}
                      max={74}
                      placeholder="—"
                      value={editingFingerSizes[finger.id] || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingFingerSizes((prev) => ({ ...prev, [finger.id]: val }));
                      }}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditBaguierModalOpen(false)}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={handleSaveBaguier}>
                Enregistrer les Tailles
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
