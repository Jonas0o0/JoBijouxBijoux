-- ==============================================================================
-- V2: Initialisation Référentiel Catalogue, Emplacements & Stock Joaillier
-- ==============================================================================

-- 1. Table des emplacements de stockage physique
CREATE TABLE IF NOT EXISTS storage_location (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    location_type VARCHAR(40) NOT NULL,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_storage_store_code UNIQUE (store_id, code)
);

CREATE INDEX IF NOT EXISTS idx_storage_type ON storage_location(location_type);

-- 2. Table des pièces joaillières unitaires sérialisées
CREATE TABLE IF NOT EXISTS jewelry_item (
    id BIGSERIAL PRIMARY KEY,
    serial_number VARCHAR(60) NOT NULL UNIQUE,
    reference_number VARCHAR(60),
    designation VARCHAR(255) NOT NULL,
    fineness VARCHAR(40) NOT NULL,
    gross_weight_grams NUMERIC(10, 3) NOT NULL,
    estimated_net_weight_grams NUMERIC(10, 3),
    master_hallmark VARCHAR(80),
    state_hallmark VARCHAR(80),
    selling_price_ttc_cents BIGINT NOT NULL,
    purchase_price_ht_cents BIGINT NOT NULL,
    tax_regime VARCHAR(50) NOT NULL DEFAULT 'STANDARD_20',
    status VARCHAR(40) NOT NULL DEFAULT 'EN_STOCK',
    storage_location_id BIGINT REFERENCES storage_location(id) ON DELETE SET NULL,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_jewelry_serial ON jewelry_item(serial_number);
CREATE INDEX IF NOT EXISTS idx_jewelry_ref ON jewelry_item(reference_number);
CREATE INDEX IF NOT EXISTS idx_jewelry_store_status ON jewelry_item(store_id, status);
CREATE INDEX IF NOT EXISTS idx_jewelry_location ON jewelry_item(storage_location_id);

-- 3. Table de traçabilité des mouvements d'inventaire
CREATE TABLE IF NOT EXISTS inventory_movement (
    id BIGSERIAL PRIMARY KEY,
    jewelry_item_id BIGINT NOT NULL REFERENCES jewelry_item(id) ON DELETE CASCADE,
    movement_type VARCHAR(40) NOT NULL,
    from_location_id BIGINT REFERENCES storage_location(id) ON DELETE SET NULL,
    to_location_id BIGINT REFERENCES storage_location(id) ON DELETE SET NULL,
    performed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_item ON inventory_movement(jewelry_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_timestamp ON inventory_movement(timestamp);
