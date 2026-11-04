-- ============================================================================
-- SCHEMA DE STAGING POUR EXTRACTION ODEIS BIJOU3
-- Permet de dumper les tables brutes de Sybase/Paradox/MSSQL avant transformation
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS legacy_odeis;

-- Table brute des articles Odeis
CREATE TABLE IF NOT EXISTS legacy_odeis.stg_article (
    ref_article VARCHAR(50) PRIMARY KEY,
    designation VARCHAR(255),
    famille_code VARCHAR(20),
    sous_famille_code VARCHAR(20),
    fournisseur_code VARCHAR(50),
    prix_achat_ht NUMERIC(12, 4),
    prix_vente_ttc NUMERIC(12, 4),
    poids_brut NUMERIC(10, 3),
    poids_fin NUMERIC(10, 3),
    titre_metal VARCHAR(50), -- "18K", "750", "9K", "375", "AG925"
    couleur_or VARCHAR(30),  -- "JAUNE", "BLANC", "ROSE", "2 ORS", "3 ORS"
    date_creation TIMESTAMP,
    stock_actuel NUMERIC(10, 2),
    code_barre VARCHAR(50),
    numero_police_entree BIGINT
);

-- Table brute des clients et tiers
CREATE TABLE IF NOT EXISTS legacy_odeis.stg_tiers (
    code_tiers VARCHAR(50) PRIMARY KEY,
    type_tiers VARCHAR(20), -- "CLIENT", "FOURNISSEUR", "FONDEUR", "FACONNIER"
    civilite VARCHAR(20),
    nom VARCHAR(150),
    prenom VARCHAR(150),
    societe VARCHAR(150),
    adresse_1 VARCHAR(255),
    adresse_2 VARCHAR(255),
    code_postal VARCHAR(20),
    ville VARCHAR(100),
    pays VARCHAR(100),
    telephone VARCHAR(50),
    mobile VARCHAR(50),
    email VARCHAR(150),
    numero_cni VARCHAR(100),
    date_delivrance_cni DATE,
    date_naissance DATE,
    lieu_naissance VARCHAR(100)
);

-- Table brute du Livre de Police historique
CREATE TABLE IF NOT EXISTS legacy_odeis.stg_livre_police (
    numero_ordre BIGINT PRIMARY KEY,
    date_entree TIMESTAMP NOT NULL,
    designation_objet TEXT NOT NULL,
    nature_matiere VARCHAR(50), -- "OR 750", "OR 375", "ARGENT 925", "PLATINE"
    poids_brut_entree NUMERIC(10, 3) NOT NULL,
    titre_millieme INT,         -- 750, 375, 925, 999
    poids_fin NUMERIC(10, 3),
    provenance_code_tiers VARCHAR(50),
    nom_vendeur VARCHAR(255),
    piece_identite_type VARCHAR(50),
    piece_identite_numero VARCHAR(100),
    date_sortie TIMESTAMP,
    destination_motif VARCHAR(50), -- "VENTE", "FONTE", "RETOUR_FOURNISSEUR", "REPARATION"
    piece_justificative_sortie VARCHAR(100) -- Numéro ticket de caisse ou facture fonte
);

-- Table brute des comptes-poids fondeurs / façonniers
CREATE TABLE IF NOT EXISTS legacy_odeis.stg_compte_poids (
    id_mouvement BIGINT PRIMARY KEY,
    code_fournisseur VARCHAR(50) NOT NULL,
    type_metal VARCHAR(20) NOT NULL, -- "OR_FINE", "OR_750", "ARGENT"
    date_mouvement TIMESTAMP NOT NULL,
    libelle_operation VARCHAR(255),
    sens VARCHAR(10), -- "CREDIT" (dépôt casse/grenaille) ou "DEBIT" (façon commandée)
    poids_net NUMERIC(10, 3) NOT NULL,
    titre NUMERIC(6, 3),
    poids_fin_equivalent NUMERIC(10, 3) NOT NULL,
    solde_progressif NUMERIC(12, 3)
);

-- Table brute des fiches SAV & Atelier
CREATE TABLE IF NOT EXISTS legacy_odeis.stg_sav (
    numero_sav VARCHAR(50) PRIMARY KEY,
    code_client VARCHAR(50),
    date_depot TIMESTAMP NOT NULL,
    description_bijou TEXT,
    nature_metal VARCHAR(50),
    poids_depose NUMERIC(10, 3),
    travaux_demandes TEXT,
    devis_estime_ttc NUMERIC(10, 2),
    statut VARCHAR(50), -- "DEPOSE", "EN_COURS", "TERMINE", "LIVRE", "REFUSE"
    date_restitution TIMESTAMP,
    poids_restitue NUMERIC(10, 3)
);
