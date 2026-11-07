export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  plan: string;
  tagline?: string;
  logoIcon?: string;
  stores: StoreInfo[];
  sellers: SellerInfo[];
}

export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  siret: string;
  tvaIntra: string;
  posNumber: string;
  city?: string;
  postalCode?: string;
  isFlagship?: boolean;
  stockCount: number;
  showcaseCount: number;
  safeCount: number;
  dailyTurnover: number;
  activeRegisters: number;
  managerName: string;
}

export interface SellerInfo {
  id: string;
  name: string;
  username?: string;
  initials: string;
  role: string;
  pin: string;
  storeId?: string;
  email?: string;
  active?: boolean;
  avatarBg?: string;
}

export interface StockTransferRecord {
  id: string;
  transferNumber: string;
  tenantId: string;
  sourceStoreId: string;
  sourceStoreName: string;
  targetStoreId: string;
  targetStoreName: string;
  productReference: string;
  productName: string;
  productCategory: string;
  unitPriceTTC: number;
  quantity: number;
  originLocation: "VITRINE" | "COFFRE";
  destinationLocation: "VITRINE" | "COFFRE";
  status: "EN_TRANSIT" | "VALIDE" | "ANNULE";
  senderSellerName: string;
  receiverSellerName?: string;
  carrier: string;
  sealNumber?: string;
  notes?: string;
  createdAt: string;
  validatedAt?: string;
}

export const SAAS_TENANTS: TenantInfo[] = [
  {
    id: "tenant-vendome",
    name: "Maison Vendôme - Haute Joaillerie",
    code: "VENDOME",
    plan: "Enterprise Joaillerie & Haute Parure",
    tagline: "Manufacture d'Excellence & Haute Joaillerie Place Vendôme",
    logoIcon: "💎",
    stores: [
      {
        id: "store-vendome-paris",
        name: "Place Vendôme Paris",
        address: "12 Place Vendôme, 75001 Paris",
        phone: "01 42 68 55 00",
        siret: "482 910 401 00028",
        tvaIntra: "FR 32 482910401",
        posNumber: "CAISSE-01",
        city: "Paris 1er",
        postalCode: "75001",
        isFlagship: true,
        stockCount: 342,
        showcaseCount: 210,
        safeCount: 132,
        dailyTurnover: 48500,
        activeRegisters: 2,
        managerName: "Sophie Valadier",
      },
      {
        id: "store-vendome-haussmann",
        name: "Printemps Haussmann",
        address: "64 Boulevard Haussmann, 75009 Paris",
        phone: "01 42 82 50 00",
        siret: "482 910 401 00036",
        tvaIntra: "FR 32 482910401",
        posNumber: "CORNER-02",
        city: "Paris 9e",
        postalCode: "75009",
        isFlagship: false,
        stockCount: 185,
        showcaseCount: 140,
        safeCount: 45,
        dailyTurnover: 21400,
        activeRegisters: 1,
        managerName: "Camille de Montmirail",
      },
      {
        id: "store-vendome-cannes",
        name: "Cannes Croisette",
        address: "45 Boulevard de la Croisette, 06400 Cannes",
        phone: "04 93 39 12 00",
        siret: "482 910 401 00044",
        tvaIntra: "FR 32 482910401",
        posNumber: "BOUTIQUE-01",
        city: "Cannes",
        postalCode: "06400",
        isFlagship: false,
        stockCount: 220,
        showcaseCount: 160,
        safeCount: 60,
        dailyTurnover: 32600,
        activeRegisters: 2,
        managerName: "Alexandre Dumas",
      },
    ],
    sellers: [
      {
        id: "emp-sophie",
        name: "Sophie Valadier",
        initials: "SV",
        role: "Conseillère Haute Joaillerie",
        pin: "1234",
        avatarBg: "from-amber-600 to-yellow-600",
      },
      {
        id: "emp-alexandre",
        name: "Alexandre Dumas",
        initials: "AD",
        role: "Directeur de Maison & Gérant",
        pin: "0000",
        avatarBg: "from-slate-700 to-slate-900",
      },
      {
        id: "emp-marc",
        name: "Marc Laurent",
        initials: "ML",
        role: "Maître Artisan Joaillier",
        pin: "5678",
        avatarBg: "from-amber-700 to-amber-900",
      },
      {
        id: "emp-camille",
        name: "Camille de Montmirail",
        initials: "CM",
        role: "Gemmologue & Vendeuse",
        pin: "4321",
        avatarBg: "from-rose-500 to-pink-700",
      },
    ],
  },
  {
    id: "tenant-dubois",
    name: "Atelier Joaillerie Dubois & Fils",
    code: "DUBOIS",
    plan: "Pro Artisan Joaillerie",
    tagline: "Maîtres Joailliers & Horlogers depuis 1892",
    logoIcon: "👑",
    stores: [
      {
        id: "store-dubois-lyon",
        name: "Boutique & Atelier Lyon Presqu'île",
        address: "18 Rue Mercière, 69002 Lyon",
        phone: "04 78 42 10 30",
        siret: "802 345 678 00012",
        tvaIntra: "FR 89 802345678",
        posNumber: "CAISSE-LYON-01",
        city: "Lyon",
        postalCode: "69002",
        isFlagship: true,
        stockCount: 168,
        showcaseCount: 95,
        safeCount: 73,
        dailyTurnover: 14200,
        activeRegisters: 1,
        managerName: "Jean-Baptiste Dubois",
      },
      {
        id: "store-dubois-bordeaux",
        name: "Bordeaux Triangle d'Or",
        address: "8 Cours de l'Intendance, 33000 Bordeaux",
        phone: "05 56 44 22 11",
        siret: "802 345 678 00020",
        tvaIntra: "FR 89 802345678",
        posNumber: "CAISSE-BDX-01",
        city: "Bordeaux",
        postalCode: "33000",
        isFlagship: false,
        stockCount: 124,
        showcaseCount: 80,
        safeCount: 44,
        dailyTurnover: 9800,
        activeRegisters: 1,
        managerName: "Élodie Garnier",
      },
    ],
    sellers: [
      {
        id: "emp-jbdubois",
        name: "Jean-Baptiste Dubois",
        initials: "JD",
        role: "Maître Bijoutier Gérant",
        pin: "1234",
        avatarBg: "from-emerald-700 to-teal-900",
      },
      {
        id: "emp-marc-d",
        name: "Marc Laurent",
        initials: "ML",
        role: "Bijoutier Atelier Sertisseur",
        pin: "5678",
        avatarBg: "from-amber-600 to-yellow-600",
      },
      {
        id: "emp-elodie",
        name: "Élodie Garnier",
        initials: "EG",
        role: "Responsable Boutique",
        pin: "2468",
        avatarBg: "from-indigo-600 to-purple-800",
      },
    ],
  },
];

export const INITIAL_TRANSFERS: StockTransferRecord[] = [
  {
    id: "TR-2026-0042",
    transferNumber: "TR-2026-0042",
    tenantId: "tenant-vendome",
    sourceStoreId: "store-vendome-paris",
    sourceStoreName: "Place Vendôme Paris",
    targetStoreId: "store-vendome-cannes",
    targetStoreName: "Cannes Croisette",
    productReference: "SOL-DIAM-050-YG",
    productName: "Solitaire Diamant 0.50ct Or Jaune 18K",
    productCategory: "bague",
    unitPriceTTC: 2890,
    quantity: 1,
    originLocation: "COFFRE",
    destinationLocation: "VITRINE",
    status: "EN_TRANSIT",
    senderSellerName: "Sophie Valadier",
    receiverSellerName: "Alexandre Dumas",
    carrier: "Brinks Haute Sécurité (Fourgon Blindé)",
    sealNumber: "BK-884920",
    notes: "Demande client VIP pour présentation privée ce samedi",
    createdAt: "2026-11-06T10:15:00.000Z",
  },
  {
    id: "TR-2026-0041",
    transferNumber: "TR-2026-0041",
    tenantId: "tenant-vendome",
    sourceStoreId: "store-vendome-cannes",
    sourceStoreName: "Cannes Croisette",
    targetStoreId: "store-vendome-paris",
    targetStoreName: "Place Vendôme Paris",
    productReference: "COL-EMER-01",
    productName: "Collier Émeraude Colombie & Diamants Platine",
    productCategory: "collier",
    unitPriceTTC: 18500,
    quantity: 1,
    originLocation: "VITRINE",
    destinationLocation: "COFFRE",
    status: "VALIDE",
    senderSellerName: "Alexandre Dumas",
    receiverSellerName: "Sophie Valadier",
    carrier: "Loomis Valeur Déclarée Express",
    sealNumber: "LM-339102",
    notes: "Retour atelier pour contrôle sertissure avant remise en vitrine",
    createdAt: "2026-11-05T14:30:00.000Z",
    validatedAt: "2026-11-06T09:12:00.000Z",
  },
  {
    id: "TR-2026-0040",
    transferNumber: "TR-2026-0040",
    tenantId: "tenant-vendome",
    sourceStoreId: "store-vendome-paris",
    sourceStoreName: "Place Vendôme Paris",
    targetStoreId: "store-vendome-haussmann",
    targetStoreName: "Printemps Haussmann",
    productReference: "BRAC-TEN-300-WG",
    productName: "Bracelet Rivière Diamants 3.00ct Or Blanc",
    productCategory: "bracelet",
    unitPriceTTC: 6200,
    quantity: 1,
    originLocation: "COFFRE",
    destinationLocation: "VITRINE",
    status: "VALIDE",
    senderSellerName: "Sophie Valadier",
    receiverSellerName: "Camille de Montmirail",
    carrier: "Coursier Maison Joaillerie",
    sealNumber: "CS-0091",
    notes: "Réassort vitrine corner grand magasin pour haute saison",
    createdAt: "2026-11-04T16:00:00.000Z",
    validatedAt: "2026-11-04T17:45:00.000Z",
  },
];
