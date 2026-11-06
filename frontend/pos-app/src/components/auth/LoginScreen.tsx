import { useState } from "react";
import {
  Lock,
  Building2,
  Store,
  UserCheck,
  KeyRound,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  Zap,
  Delete,
} from "lucide-react";
import { SAAS_TENANTS, type TenantInfo, type StoreInfo, type SellerInfo } from "../../data/saasData";
import { useUserStore } from "../../store/useUserStore";

export function LoginScreen() {
  const { login } = useUserStore();

  const [selectedTenantId, setSelectedTenantId] = useState<string>("tenant-vendome");
  const selectedTenant: TenantInfo =
    SAAS_TENANTS.find((t) => t.id === selectedTenantId) || SAAS_TENANTS[0];

  const [selectedStoreId, setSelectedStoreId] = useState<string>(selectedTenant.stores[0].id);
  const selectedStore: StoreInfo =
    selectedTenant.stores.find((s) => s.id === selectedStoreId) || selectedTenant.stores[0];

  const [selectedSellerId, setSelectedSellerId] = useState<string>(selectedTenant.sellers[0].id);
  const selectedSeller: SellerInfo =
    selectedTenant.sellers.find((s) => s.id === selectedSellerId) || selectedTenant.sellers[0];

  const [pinCode, setPinCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When changing tenant, reset store and seller to tenant's first elements
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = SAAS_TENANTS.find((t) => t.id === tenantId) || SAAS_TENANTS[0];
    setSelectedStoreId(tenant.stores[0].id);
    setSelectedSellerId(tenant.sellers[0].id);
    setPinCode("");
    setErrorMessage("");
  };

  const handleSellerChange = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setPinCode("");
    setErrorMessage("");
  };

  const handleKeypadPress = (digit: string) => {
    if (pinCode.length < 6) {
      setPinCode((prev) => prev + digit);
      setErrorMessage("");
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setErrorMessage("");
  };

  const handleClearPin = () => {
    setPinCode("");
    setErrorMessage("");
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check PIN: if entered pin matches seller.pin OR if pin is standard "1234" / "0000" / exact seller pin
    const validPin = selectedSeller.pin || "1234";
    if (pinCode && pinCode !== validPin && pinCode !== "1234" && pinCode !== "0000") {
      setErrorMessage(`Code PIN invalide. (Indice démo: ${validPin})`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      login(selectedTenant.id, selectedStore.id, selectedSeller);
      setIsSubmitting(false);
    }, 300);
  };

  // Instant 1-Click Demo Login handler
  const handleQuickDemoLogin = (
    tenantId: string,
    storeId: string,
    sellerId: string
  ) => {
    const tenant = SAAS_TENANTS.find((t) => t.id === tenantId) || SAAS_TENANTS[0];
    const store = tenant.stores.find((s) => s.id === storeId) || tenant.stores[0];
    const seller = tenant.sellers.find((s) => s.id === sellerId) || tenant.sellers[0];

    setIsSubmitting(true);
    setTimeout(() => {
      login(tenant.id, store.id, seller);
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex flex-col justify-between select-none font-sans text-slate-800">
      {/* Top Brand & Security Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            💎
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-slate-900">
                ERPBijoux SaaS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                Multi-Boutiques
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Système de Caisse & Gestion Joaillerie Haute Précision
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Cloud Multi-Tenant Sécurisé</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Norme NF525 & Métrologie</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Form: Tenant, Store, Seller & PIN */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/80 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Identification Sécurisée Caisse</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Ouvrir la Caisse & Session
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sélectionnez votre enseigne, la boutique active et votre profil collaborateur.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* 1. Tenant / Enseigne Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>1. Enseigne Joaillerie (Tenant SaaS)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SAAS_TENANTS.map((tenant) => {
                    const isSelected = tenant.id === selectedTenantId;
                    return (
                      <button
                        type="button"
                        key={tenant.id}
                        onClick={() => handleTenantChange(tenant.id)}
                        className={`text-left p-3 rounded-2xl border transition-all text-xs ${
                          isSelected
                            ? "bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{tenant.logoIcon}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              isSelected
                                ? "bg-amber-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {tenant.code}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 mt-1 truncate">
                          {tenant.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {tenant.plan}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Store / Boutique Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>2. Boutique & Point de Vente</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedTenant.stores.map((store) => {
                    const isSelected = store.id === selectedStoreId;
                    return (
                      <button
                        type="button"
                        key={store.id}
                        onClick={() => setSelectedStoreId(store.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-600 ring-1 ring-amber-500/30 font-semibold"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">
                            {store.city || store.name}
                          </span>
                          {store.isFlagship && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                              Flagship
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {store.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {store.posNumber}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Seller / Collaborator */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. Collaborateur Vendeur Caisse</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {selectedTenant.sellers.map((seller) => {
                    const isSelected = seller.id === selectedSellerId;
                    return (
                      <button
                        type="button"
                        key={seller.id}
                        onClick={() => handleSellerChange(seller.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-amber-50 border-amber-500 text-slate-900 font-semibold shadow-2xs"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                            seller.avatarBg || "from-amber-600 to-yellow-600"
                          } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                        >
                          {seller.initials}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {seller.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {seller.role}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. PIN Code Input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>4. Code PIN Caisse ou Mot de Passe</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Indice démo: <strong className="text-amber-700">{selectedSeller.pin || "1234"}</strong>
                  </span>
                </div>

                {/* Display dots / value */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => {
                        setPinCode(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="Saisir PIN caisse..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-mono text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                    />
                    <Fingerprint className="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  {pinCode && (
                    <button
                      type="button"
                      onClick={handleClearPin}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-600"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Compact On-Screen Keypad */}
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="h-9 rounded-lg bg-white hover:bg-slate-100 active:bg-amber-100 border border-slate-200 text-sm font-bold font-mono text-slate-800 transition-colors shadow-2xs"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleBackspace}
                    title="Supprimer un chiffre"
                    className="col-span-2 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs flex items-center justify-center gap-1"
                  >
                    <Delete className="w-4 h-4 text-slate-500" />
                    <span>Effacer</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 animate-shake">
                    <span>⚠️ {errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Main Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Ouverture de session en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-200" />
                    <span>Ouvrir la Caisse & Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Sidebar: Quick 1-Click Demo & SaaS Info */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-amber-50/30 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Connexion Rapide Démo (1-Clic)</span>
              </div>
              <p className="text-xs text-slate-600">
                Accédez immédiatement à l'environnement pré-configuré sans saisir de code PIN :
              </p>

              {/* Demo Button 1: Vendôme Flagship (Sophie) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    "tenant-vendome",
                    "store-vendome-paris",
                    "emp-sophie"
                  )
                }
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-left transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💎</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800 flex items-center gap-1.5">
                        <span>Maison Vendôme • Flagship Paris</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Sophie Valadier • Conseillère Joaillerie
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    Entrer →
                  </span>
                </div>
              </button>

              {/* Demo Button 2: Vendôme Management (Alexandre Dumas) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    "tenant-vendome",
                    "store-vendome-cannes",
                    "emp-alexandre"
                  )
                }
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-left transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🏛️</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800 flex items-center gap-1.5">
                        <span>Maison Vendôme • Cannes Croisette</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Alexandre Dumas • Directeur & Gérant Multi-Sites
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    Entrer →
                  </span>
                </div>
              </button>

              {/* Demo Button 3: Atelier Dubois (Jean-Baptiste Dubois) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    "tenant-dubois",
                    "store-dubois-lyon",
                    "emp-jbdubois"
                  )
                }
                className="w-full p-3.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-left transition-all shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">👑</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800 flex items-center gap-1.5">
                        <span>Atelier Dubois & Fils • Lyon Presqu'île</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Jean-Baptiste Dubois • Maître Artisan Gérant
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    Entrer →
                  </span>
                </div>
              </button>
            </div>

            {/* Legal & Compliance Summary */}
            <div className="pt-4 border-t border-slate-200/90 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>Garanties Réglementaires Incluses</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-slate-500">
                <li>Journal fiscal inaltérable avec chaînage SHA-256</li>
                <li>Livre de Police numérique conforme douanes</li>
                <li>Pesée certifiée sur balance métrologie légale</li>
                <li>Cloisonnement strict des données multi-tenants</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Legal Footer */}
      <footer className="px-6 py-3 border-t border-slate-200/80 bg-white/60 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ERPBijoux Cloud SaaS • Joaillerie, Orfèvrerie & Horlogerie</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Conforme Art. 286 I-3° bis du CGI</span>
        </div>
        <div className="font-mono text-slate-400">
          Version 2.4.0 • Instance certifiée NF525
        </div>
      </footer>
    </div>
  );
}
