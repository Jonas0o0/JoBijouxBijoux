import { useState } from "react";
import {
  Users,
  UserPlus,
  KeyRound,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Store,
  Sparkles,
  Shield,
  Edit3,
} from "lucide-react";
import { useUserStore } from "../../store/useUserStore";
import { Modal } from "@erp-bijoux/shared-ui";
import type { SellerInfo } from "../../data/saasData";

export function StaffManagementTab() {
  const {
    stores,
    sellers,
    currentStore,
    addSeller,
    toggleSellerActive,
    setSeller,
    currentSeller,
    updateSellerRole,
  } = useUserStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Role Edit state
  const [roleEditTarget, setRoleEditTarget] = useState<SellerInfo | null>(null);
  const [editSecurityRole, setEditSecurityRole] = useState<"ROLE_ADMIN" | "ROLE_GERANT" | "ROLE_VENDEUR">("ROLE_VENDEUR");
  const [editRoleTitle, setEditRoleTitle] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Form state for new seller
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Conseillère Joaillerie");
  const [newSellerSecurityRole, setNewSellerSecurityRole] = useState<"ROLE_ADMIN" | "ROLE_GERANT" | "ROLE_VENDEUR">("ROLE_VENDEUR");
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    currentStore?.id || (stores[0] ? stores[0].id : "store-vendome-paris")
  );
  const [pin, setPin] = useState("7842");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const togglePinVisibility = (sellerId: string) => {
    setShowPins((prev) => ({ ...prev, [sellerId]: !prev[sellerId] }));
  };

  const handleOpenEditRole = (seller: SellerInfo) => {
    setRoleEditTarget(seller);
    setEditSecurityRole(
      seller.securityRole ||
        (seller.role.includes("Direct") || seller.role.includes("Gérant")
          ? "ROLE_GERANT"
          : seller.role.includes("Admin")
          ? "ROLE_ADMIN"
          : "ROLE_VENDEUR")
    );
    setEditRoleTitle(seller.role);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleEditTarget) return;

    setIsSavingRole(true);
    await updateSellerRole(roleEditTarget.id, editSecurityRole, editRoleTitle);
    setIsSavingRole(false);
    setRoleEditTarget(null);
    setNotification(`Habilitations et rôle mis à jour avec succès pour ${roleEditTarget.name} !`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !pin || pin.length < 4) return;

    setIsSubmitting(true);
    const generatedUsername =
      username.trim() ||
      fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10);

    const generatedInitials = fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "VJ";

    // 1. Try sending to backend Spring Boot API
    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": "1",
        },
        body: JSON.stringify({
          storeId: 1,
          username: generatedUsername,
          fullName: fullName,
          pin: pin,
          role: role.includes("Direct") || role.includes("Responsable") ? "ROLE_RESPONSABLE_MAGASIN" : "ROLE_VENDEUR",
          email: email || `${generatedUsername}@vendome-bijoux.fr`,
        }),
      });
      if (res.ok) {
        console.log("Seller created successfully on backend Spring Boot API");
      }
    } catch (err) {
      console.warn("Backend user creation offline, using local store:", err);
    }

    // 2. Add to Zustand store & local storage
    const newSellerItem: SellerInfo = {
      id: `emp-${Date.now()}`,
      name: fullName,
      username: generatedUsername,
      initials: generatedInitials,
      role: role,
      securityRole: newSellerSecurityRole,
      pin: pin,
      storeId: selectedStoreId,
      email: email || `${generatedUsername}@vendome-bijoux.fr`,
      active: true,
      avatarBg: "from-amber-600 to-yellow-600",
    };

    addSeller(newSellerItem);
    setIsSubmitting(false);
    setIsCreateModalOpen(false);

    // Reset Form
    setFullName("");
    setUsername("");
    setEmail("");
    setPin("1234");
    setNotification(`Compte créé avec succès pour ${fullName} (Code PIN: ${pin}) !`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Notification banner */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Staff Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Équipe & Vendeuses du Réseau ({sellers.length} collaboratrices)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion des comptes vendeurs, habilitations de caisse, et codes PIN de sécurité NF525
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un Compte Vendeuse</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">Collaboratrice</th>
                <th className="py-3 px-4 font-medium">Boutique Affectée</th>
                <th className="py-3 px-4 font-medium">Rôle / Fonction</th>
                <th className="py-3 px-4 font-medium text-center">Code PIN Caisse</th>
                <th className="py-3 px-4 font-medium text-center">Statut</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((seller) => {
                const assignedStore = stores.find((s) => s.id === seller.storeId) || currentStore;
                const isCurrent = seller.id === currentSeller.id;
                const isShowingPin = showPins[seller.id];

                return (
                  <tr key={seller.id} className="hover:bg-slate-50 transition-colors">
                    {/* User profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                            seller.avatarBg || "from-amber-600 to-yellow-600"
                          } flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}
                        >
                          {seller.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{seller.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Vous
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {seller.username ? `@${seller.username}` : seller.email || "vendeuse"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{assignedStore?.name || "Boutique Vendôme"}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {assignedStore?.city || "Paris"}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="font-medium text-slate-800 block">{seller.role}</span>
                        {seller.securityRole === "ROLE_ADMIN" || seller.role.toLowerCase().includes("admin") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Shield className="w-2.5 h-2.5 text-amber-600" />
                            <span>👑 Patron / Direction</span>
                          </span>
                        ) : seller.securityRole === "ROLE_GERANT" || seller.role.toLowerCase().includes("gérant") || seller.role.toLowerCase().includes("direct") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Shield className="w-2.5 h-2.5 text-blue-600" />
                            <span>👔 Gérant Magasin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Shield className="w-2.5 h-2.5 text-emerald-600" />
                            <span>💎 Vendeuse (Épurée)</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PIN */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800">
                        <span>{isShowingPin ? seller.pin || "1234" : "••••"}</span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(seller.id)}
                          className="text-slate-400 hover:text-slate-700 transition-colors ml-1"
                          title={isShowingPin ? "Masquer le code PIN" : "Afficher le code PIN"}
                        >
                          {isShowingPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleSellerActive(seller.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                          seller.active !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                        title="Cliquer pour activer / désactiver"
                      >
                        {seller.active !== false ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Désactivée</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit Role Button (Available for Managers & Admins) */}
                        <button
                          onClick={() => handleOpenEditRole(seller)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-800 text-slate-700 font-medium text-[11px] border border-slate-200 transition-all flex items-center gap-1 shadow-2xs"
                          title="Modifier les droits d'accès et le rôle"
                        >
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          <span>Rôle & Droits</span>
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => setSeller(seller)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] border border-slate-200 transition-all"
                          >
                            Basculer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Creation Vendeuse */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span>Créer un Compte Vendeuse / Collaborateur</span>
            </div>
          }
          description="Création immédiate avec attribution de magasin et code PIN d'ouverture de caisse"
          maxWidth="md"
        >
          <form onSubmit={handleCreateSeller} className="space-y-4">
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-900">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Nouvel Accès Vendeuse Joaillerie</p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  La vendeuse pourra immédiatement se connecter à l'ERP SaaS sur n'importe quel terminal ou smartphone avec son code PIN à 4 chiffres.
                </p>
              </div>
            </div>

            {/* Nom & Prénom */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nom complet de la vendeuse *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Sophie Martin"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Username & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Identifiant / Pseudo
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: smartin"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Professionnel
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sophie.martin@vendome.fr"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Role & Store Selection */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Intitulé du Poste *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="Conseillère Haute Joaillerie">Conseillère Haute Joaillerie</option>
                  <option value="Directrice de Boutique">Directrice de Boutique</option>
                  <option value="Gemmologue & Vendeuse">Gemmologue & Vendeuse</option>
                  <option value="Maître Artisan Joaillier">Maître Artisan Joaillier</option>
                  <option value="Apprentie Joaillerie">Apprentie Joaillerie</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Droits & Habilitations *
                </label>
                <select
                  value={newSellerSecurityRole}
                  onChange={(e) => setNewSellerSecurityRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="ROLE_VENDEUR">💎 Vendeuse (Interface Épurée)</option>
                  <option value="ROLE_GERANT">👔 Gérant (Gestion Boutique)</option>
                  <option value="ROLE_ADMIN">👑 Direction (Tous Droits)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Boutique de Rattachement *
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PIN Code */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Code PIN Caisse (4 chiffres) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="7842"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ce code PIN personnel servira à déverrouiller la caisse et signer les transactions fiscales.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !fullName || pin.length < 4}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-amber-200" />
                <span>{isSubmitting ? "Création en cours..." : "Créer le Compte Vendeuse"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Edition Role & Droits */}
      {roleEditTarget && (
        <Modal
          isOpen={!!roleEditTarget}
          onClose={() => setRoleEditTarget(null)}
          title={
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span>Gestion des Droits & Habilitations : {roleEditTarget.name}</span>
            </div>
          }
          description="Affectez le profil de sécurité. L'interface s'adaptera automatiquement pour masquer les fonctions non autorisées."
          maxWidth="md"
        >
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                  roleEditTarget.avatarBg || "from-amber-600 to-yellow-600"
                } flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0`}
              >
                {roleEditTarget.initials}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{roleEditTarget.name}</div>
                <div className="text-xs text-slate-500 font-mono">
                  {roleEditTarget.email || roleEditTarget.username || "collaborateur"}
                </div>
              </div>
            </div>

            {/* Profile Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Niveau d'Accès & Périmètre de Responsabilité *
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. ROLE_VENDEUR */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    editSecurityRole === "ROLE_VENDEUR"
                      ? "bg-amber-500/10 border-amber-500 text-slate-900 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="securityRole"
                    value="ROLE_VENDEUR"
                    checked={editSecurityRole === "ROLE_VENDEUR"}
                    onChange={() => setEditSecurityRole("ROLE_VENDEUR")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <span>💎 Vendeuse Joaillerie (Interface Épurée)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Quotidien Caisse
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Accès restreint à la caisse POS, consultation stock vitrine/coffre, baguier CRM, dépôt SAV atelier et rachat d'or.{" "}
                      <strong className="text-rose-600">Comptabilité, FEC et autres magasins masqués.</strong>
                    </p>
                  </div>
                </label>

                {/* 2. ROLE_GERANT */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    editSecurityRole === "ROLE_GERANT"
                      ? "bg-amber-500/10 border-amber-500 text-slate-900 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="securityRole"
                    value="ROLE_GERANT"
                    checked={editSecurityRole === "ROLE_GERANT"}
                    onChange={() => setEditSecurityRole("ROLE_GERANT")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <span>👔 Directrice / Gérant de Magasin</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                        Gestion Boutique
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gestion complète de sa boutique : caisse, commandes réassort, clôtures Z et M mensuelles, récolement livre de police, et gestion de ses vendeuses.
                    </p>
                  </div>
                </label>

                {/* 3. ROLE_ADMIN */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    editSecurityRole === "ROLE_ADMIN"
                      ? "bg-amber-500/10 border-amber-500 text-slate-900 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="securityRole"
                    value="ROLE_ADMIN"
                    checked={editSecurityRole === "ROLE_ADMIN"}
                    onChange={() => setEditSecurityRole("ROLE_ADMIN")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <span>👑 Direction Générale / Patron (Accès Intégral)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                        Superviseur
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Accès global multi-magasins : grand livre comptable, export FEC fiscal officiel, clôture annuelle A, configuration de la franchise SaaS.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Role Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Intitulé affiché sur la fiche collaborateur
              </label>
              <input
                type="text"
                value={editRoleTitle}
                onChange={(e) => setEditRoleTitle(e.target.value)}
                placeholder="Ex: Conseillère Haute Joaillerie & Baguier"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRoleEditTarget(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSavingRole}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <Shield className="w-4 h-4 text-amber-200" />
                <span>{isSavingRole ? "Enregistrement..." : "Appliquer Rôle & Droits"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
