-- ==============================================================================
-- V1: Initialisation Socle Sécurité RBAC, Magasins & Audit WORM (NF525)
-- ==============================================================================

-- 1. Table des points de vente / boutiques HBJO
CREATE TABLE IF NOT EXISTS stores (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    siret VARCHAR(20),
    address VARCHAR(255),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(120),
    vat_number VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_code ON stores(code);

-- 2. Table des utilisateurs & opérateurs
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(80),
    last_name VARCHAR(80),
    email VARCHAR(120) UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Table des rôles utilisateurs (RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- 4. Journal des Événements Techniques (JET) - Inaltérable WORM (NF525)
CREATE TABLE IF NOT EXISTS jet_audit_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50) NOT NULL,
    principal VARCHAR(100) NOT NULL,
    store_id BIGINT,
    ip_address VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(80),
    resource_id VARCHAR(80),
    details TEXT,
    sequence_number BIGINT NOT NULL UNIQUE,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    signature VARCHAR(128) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jet_seq ON jet_audit_log(sequence_number);
CREATE INDEX IF NOT EXISTS idx_jet_timestamp ON jet_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_jet_principal ON jet_audit_log(principal);

-- 5. Compteurs de séquences fiscales (Anti-trou et anti-rupture)
CREATE TABLE IF NOT EXISTS fiscal_sequence_counter (
    id BIGSERIAL PRIMARY KEY,
    sequence_type VARCHAR(50) NOT NULL,
    store_id BIGINT,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sequence_store_type UNIQUE (sequence_type, store_id)
);
