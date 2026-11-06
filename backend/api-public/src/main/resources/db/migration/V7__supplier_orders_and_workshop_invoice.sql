-- ==============================================================================
-- V7: Commandes Fournisseurs & Facturation SAV / Réparations
-- ==============================================================================

-- 1. Table des Commandes Fournisseurs
CREATE TABLE IF NOT EXISTS supplier_order (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(60) NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(150) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'COMMANDE',
    destination_stock VARCHAR(50),
    total_amount_ht_cents BIGINT NOT NULL DEFAULT 0,
    total_vat_cents BIGINT NOT NULL DEFAULT 0,
    total_amount_ttc_cents BIGINT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ordered_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sup_order_num ON supplier_order(order_number);
CREATE INDEX IF NOT EXISTS idx_sup_order_store ON supplier_order(store_id);
CREATE INDEX IF NOT EXISTS idx_sup_order_status ON supplier_order(status);

-- 2. Table des Lignes de Commande Fournisseur
CREATE TABLE IF NOT EXISTS supplier_order_item (
    id BIGSERIAL PRIMARY KEY,
    supplier_order_id BIGINT NOT NULL REFERENCES supplier_order(id) ON DELETE CASCADE,
    reference_number VARCHAR(60),
    designation VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    received_quantity INT NOT NULL DEFAULT 0,
    unit_purchase_price_ht_cents BIGINT NOT NULL,
    total_purchase_price_ht_cents BIGINT NOT NULL,
    fineness VARCHAR(40) DEFAULT 'OR_750',
    gross_weight_grams NUMERIC(10, 3),
    selling_price_ttc_cents BIGINT,
    vat_regime VARCHAR(50) DEFAULT 'STANDARD_20'
);

CREATE INDEX IF NOT EXISTS idx_sup_item_order ON supplier_order_item(supplier_order_id);

-- 3. Extension de la table workshop_repair_order (acompte et main d'œuvre)
ALTER TABLE workshop_repair_order
    ADD COLUMN IF NOT EXISTS deposit_paid_cents BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS labor_cost_cents BIGINT DEFAULT 0;

-- 4. Extension de la table pos_ticket_line pour référencer la réparation SAV le cas échéant
ALTER TABLE pos_ticket_line
    ADD COLUMN IF NOT EXISTS repair_order_id BIGINT REFERENCES workshop_repair_order(id) ON DELETE SET NULL;
