-- ==============================================================================
-- V3: Initialisation Caisse POS (NF525) & Livre de Police Inaltérable (CGI 537/538)
-- ==============================================================================

-- 1. Table des Tickets de Caisse (POS)
CREATE TABLE IF NOT EXISTS pos_ticket (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(60) NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    operator_username VARCHAR(100) NOT NULL,
    customer_id BIGINT,
    total_ht_cents BIGINT NOT NULL,
    total_vat_cents BIGINT NOT NULL,
    total_ttc_cents BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    signature VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_ticket_num ON pos_ticket(ticket_number);
CREATE INDEX IF NOT EXISTS idx_pos_ticket_store ON pos_ticket(store_id);
CREATE INDEX IF NOT EXISTS idx_pos_ticket_created ON pos_ticket(created_at);

-- 2. Table des Lignes de Ticket POS (Ventilation TVA 20%, 5.5% et Régime Marge 297A)
CREATE TABLE IF NOT EXISTS pos_ticket_line (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES pos_ticket(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_type VARCHAR(40) NOT NULL,
    jewelry_item_id BIGINT REFERENCES jewelry_item(id) ON DELETE SET NULL,
    designation VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price_ttc_cents BIGINT NOT NULL,
    total_ttc_cents BIGINT NOT NULL,
    vat_rate NUMERIC(5, 2) NOT NULL,
    vat_regime VARCHAR(50) NOT NULL,
    vat_amount_cents BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pos_line_ticket ON pos_ticket_line(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pos_line_item ON pos_ticket_line(jewelry_item_id);

-- 3. Table des Règlements / Transactions de Paiement (Multi-moyens NF525)
CREATE TABLE IF NOT EXISTS payment_transaction (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES pos_ticket(id) ON DELETE CASCADE,
    payment_method VARCHAR(40) NOT NULL,
    amount_cents BIGINT NOT NULL,
    transaction_reference VARCHAR(100),
    tpe_auth_token VARCHAR(100),
    voucher_code VARCHAR(100),
    scrap_dossier_id BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pos_payment_ticket ON payment_transaction(ticket_id);

-- 4. Table des Clôtures Fiscales (Tickets X & Z Journalier, Mensuel, Annuel - NF525)
CREATE TABLE IF NOT EXISTS fiscal_closure (
    id BIGSERIAL PRIMARY KEY,
    closure_type VARCHAR(40) NOT NULL,
    sequence_number BIGINT NOT NULL,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    operator_username VARCHAR(100) NOT NULL,
    opening_date TIMESTAMP WITH TIME ZONE NOT NULL,
    closing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_ttc_cents BIGINT NOT NULL,
    total_ht_cents BIGINT NOT NULL,
    total_vat_cents BIGINT NOT NULL,
    vat_breakdown_json TEXT NOT NULL,
    payment_breakdown_json TEXT NOT NULL,
    grand_total_cumulative_cents BIGINT NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    signature VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fiscal_closure_store ON fiscal_closure(store_id, closure_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_closure_seq ON fiscal_closure(sequence_number);

-- 5. Table du Livre de Police Inaltérable (CGI art. 537/538, DGDDI)
CREATE TABLE IF NOT EXISTS police_book_entry (
    id BIGSERIAL PRIMARY KEY,
    sequence_number BIGINT NOT NULL UNIQUE,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    entry_type VARCHAR(40) NOT NULL,
    item_description VARCHAR(500) NOT NULL,
    metal_type VARCHAR(40) NOT NULL,
    fineness VARCHAR(40) NOT NULL,
    gross_weight_grams NUMERIC(10, 3) NOT NULL,
    estimated_net_weight_grams NUMERIC(10, 3),
    hallmarks VARCHAR(100),
    seller_full_name VARCHAR(150) NOT NULL,
    seller_cni_passport VARCHAR(100) NOT NULL,
    seller_address VARCHAR(255),
    purchase_price_cents BIGINT NOT NULL,
    exit_date TIMESTAMP WITH TIME ZONE,
    exit_ticket_number VARCHAR(60),
    exit_reason VARCHAR(100),
    exit_price_cents BIGINT,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    signature VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_police_seq ON police_book_entry(sequence_number);
CREATE INDEX IF NOT EXISTS idx_police_store ON police_book_entry(store_id);
CREATE INDEX IF NOT EXISTS idx_police_date ON police_book_entry(entry_date);
