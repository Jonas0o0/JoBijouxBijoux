-- ==============================================================================
-- V4: Initialisation Rachat d'Or (TMP 11.5%), Atelier/SAV, Comptes-Poids & CRM
-- ==============================================================================

-- 1. Table CRM Clients & Conformité KYC
CREATE TABLE IF NOT EXISTS crm_customer (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE,
    phone VARCHAR(40),
    address VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    cni_passport_number VARCHAR(80),
    cni_expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_customer_name ON crm_customer(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customer_email ON crm_customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_cni ON crm_customer(cni_passport_number);

-- 2. Table CRM Mensurations & Tailles de Doigts (Baguier 48-64)
CREATE TABLE IF NOT EXISTS crm_customer_measurement (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES crm_customer(id) ON DELETE CASCADE,
    measurement_type VARCHAR(40) NOT NULL,
    value NUMERIC(6, 2) NOT NULL,
    finger_name VARCHAR(60),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cust_meas_cust ON crm_customer_measurement(customer_id);

-- 3. Table Dossiers de Rachat d'Or (Art. L224-96 C. Conso, Interdiction Espèces)
CREATE TABLE IF NOT EXISTS gold_repurchase_dossier (
    id BIGSERIAL PRIMARY KEY,
    dossier_number VARCHAR(60) NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    operator_username VARCHAR(100) NOT NULL,
    customer_id BIGINT REFERENCES crm_customer(id) ON DELETE SET NULL,
    seller_full_name VARCHAR(150) NOT NULL,
    seller_cni_passport VARCHAR(100) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    payment_method VARCHAR(40) NOT NULL DEFAULT 'VIREMENT',
    total_gross_weight_grams NUMERIC(10, 3) NOT NULL,
    total_estimated_net_weight_grams NUMERIC(10, 3) NOT NULL,
    total_gross_amount_cents BIGINT NOT NULL,
    tax_strategy VARCHAR(40) NOT NULL DEFAULT 'TMP_11_5',
    tax_amount_cents BIGINT NOT NULL,
    net_payable_to_seller_cents BIGINT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    cooling_off_ends_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gold_dossier_num ON gold_repurchase_dossier(dossier_number);
CREATE INDEX IF NOT EXISTS idx_gold_dossier_store ON gold_repurchase_dossier(store_id);
CREATE INDEX IF NOT EXISTS idx_gold_dossier_status ON gold_repurchase_dossier(status);

-- 4. Table des Lots / Pièces de Métal Précieux Rachetés
CREATE TABLE IF NOT EXISTS gold_scrap_item (
    id BIGSERIAL PRIMARY KEY,
    dossier_id BIGINT NOT NULL REFERENCES gold_repurchase_dossier(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    metal_type VARCHAR(40) NOT NULL,
    fineness VARCHAR(40) NOT NULL,
    gross_weight_grams NUMERIC(10, 3) NOT NULL,
    estimated_net_weight_grams NUMERIC(10, 3) NOT NULL,
    purity_rate NUMERIC(5, 4) NOT NULL,
    unit_price_per_gram_cents BIGINT NOT NULL,
    total_price_cents BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gold_scrap_dossier ON gold_scrap_item(dossier_id);

-- 5. Table des Lots de Fonte / Expédition Affineur
CREATE TABLE IF NOT EXISTS casting_batch (
    id BIGSERIAL PRIMARY KEY,
    batch_number VARCHAR(60) NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    operator_username VARCHAR(100) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PREPARATION',
    total_gross_weight_grams NUMERIC(10, 3) NOT NULL,
    total_fine_gold_grams NUMERIC(10, 3) NOT NULL,
    foundry_name VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_casting_batch_num ON casting_batch(batch_number);

-- 6. Table Atelier SAV & Réparations (Bon de confié, SVG des défauts, devis)
CREATE TABLE IF NOT EXISTS workshop_repair_order (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(60) NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    customer_id BIGINT REFERENCES crm_customer(id) ON DELETE SET NULL,
    operator_username VARCHAR(100) NOT NULL,
    assigned_artisan_username VARCHAR(100),
    status VARCHAR(40) NOT NULL DEFAULT 'DEPOT',
    item_description VARCHAR(500) NOT NULL,
    metal_type VARCHAR(40) NOT NULL,
    fineness VARCHAR(40) NOT NULL,
    gross_weight_grams NUMERIC(10, 3) NOT NULL,
    macro_photo_url VARCHAR(500),
    svg_defect_diagram TEXT,
    estimated_quote_cents BIGINT,
    final_price_cents BIGINT,
    customer_notes TEXT,
    deposit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    target_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_repair_order_num ON workshop_repair_order(order_number);
CREATE INDEX IF NOT EXISTS idx_repair_order_status ON workshop_repair_order(status);

-- 7. Table Atelier Fabrication Sur-Mesure (BOM & Freinte / Perte au feu 3-8%)
CREATE TABLE IF NOT EXISTS workshop_custom_order (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(60) NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    customer_id BIGINT REFERENCES crm_customer(id) ON DELETE SET NULL,
    operator_username VARCHAR(100) NOT NULL,
    assigned_artisan_username VARCHAR(100),
    status VARCHAR(40) NOT NULL DEFAULT 'DEVIS',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_gold_weight_grams NUMERIC(10, 3) NOT NULL,
    fire_loss_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    final_weight_grams NUMERIC(10, 3),
    quote_price_cents BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_custom_order_num ON workshop_custom_order(order_number);

-- 8. Table des Composants de Nomenclature Atelier (BOM)
CREATE TABLE IF NOT EXISTS workshop_component (
    id BIGSERIAL PRIMARY KEY,
    repair_order_id BIGINT REFERENCES workshop_repair_order(id) ON DELETE CASCADE,
    custom_order_id BIGINT REFERENCES workshop_custom_order(id) ON DELETE CASCADE,
    component_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_cost_cents BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ws_comp_repair ON workshop_component(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_ws_comp_custom ON workshop_component(custom_order_id);

-- 9. Table Registre Comptes-Poids Or Fin (Affineurs, Façonniers)
CREATE TABLE IF NOT EXISTS weight_account_ledger (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    partner_name VARCHAR(120) NOT NULL,
    partner_type VARCHAR(40) NOT NULL,
    metal_type VARCHAR(40) NOT NULL DEFAULT 'GOLD',
    movement_type VARCHAR(40) NOT NULL,
    weight_fine_gold_grams NUMERIC(10, 3) NOT NULL,
    balance_after_grams NUMERIC(10, 3) NOT NULL,
    reference_document VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_weight_account_partner ON weight_account_ledger(partner_name, metal_type);

-- 10. Table Cours Spot / Fixing Métaux Précieux
CREATE TABLE IF NOT EXISTS gold_fixing_rate (
    id BIGSERIAL PRIMARY KEY,
    metal_type VARCHAR(40) NOT NULL DEFAULT 'GOLD',
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    spot_price_per_gram_cents BIGINT NOT NULL,
    fixing_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(80) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gold_fixing_metal ON gold_fixing_rate(metal_type, fixing_timestamp);
