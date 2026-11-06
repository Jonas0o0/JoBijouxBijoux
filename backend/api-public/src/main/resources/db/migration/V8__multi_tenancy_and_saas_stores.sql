-- ==============================================================================
-- V8: Socle SaaS Multi-Tenant & Multi-Boutiques
-- ==============================================================================

-- 1. Table des entreprises / tenants SaaS
CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    siret VARCHAR(20),
    plan VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);

-- 2. Association des magasins à leur tenant (clé étrangère)
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON stores(tenant_id);

-- 3. Insertion des 2 entreprises SaaS de démonstration
INSERT INTO tenants (id, code, name, siret, plan, active)
VALUES
    (1, 'maison-vendome', 'Maison Vendôme - Haute Joaillerie', '12345678900012', 'PREMIUM_HAUTE_JOAILLERIE', TRUE),
    (2, 'joaillerie-dubois', 'Atelier Joaillerie Dubois & Fils', '98765432100019', 'STANDARD', TRUE)
ON CONFLICT (id) DO UPDATE 
SET code = EXCLUDED.code, name = EXCLUDED.name, siret = EXCLUDED.siret, plan = EXCLUDED.plan, active = EXCLUDED.active;

-- 4. Insertion / mise à jour des magasins et rattachement aux tenants
-- Tenant 1 : Maison Vendôme (3 magasins)
INSERT INTO stores (id, code, name, siret, address, postal_code, city, phone, email, vat_number, active, tenant_id)
VALUES (
    1,
    'STORE-PARIS-01',
    'Boutique Flagship Place Vendôme - Paris 1er',
    '12345678900012',
    '1 Place Vendôme',
    '75001',
    'Paris',
    '01 42 68 00 00',
    'vendome@maison-vendome.fr',
    'FR12123456789',
    TRUE,
    1
) ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id;

INSERT INTO stores (id, code, name, siret, address, postal_code, city, phone, email, vat_number, active, tenant_id)
VALUES (
    2,
    'STORE-PARIS-02',
    'Boutique Printemps Haussmann - Paris 9e',
    '12345678900020',
    '64 Boulevard Haussmann',
    '75009',
    'Paris',
    '01 42 82 50 00',
    'haussmann@maison-vendome.fr',
    'FR12123456789',
    TRUE,
    1
) ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id;

INSERT INTO stores (id, code, name, siret, address, postal_code, city, phone, email, vat_number, active, tenant_id)
VALUES (
    3,
    'STORE-CANNES-03',
    'Boutique Cannes Croisette',
    '12345678900038',
    '47 Boulevard de la Croisette',
    '06400',
    'Cannes',
    '04 93 39 00 00',
    'cannes@maison-vendome.fr',
    'FR12123456789',
    TRUE,
    1
) ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id;

-- Tenant 2 : Joaillerie Dubois (2 magasins)
INSERT INTO stores (id, code, name, siret, address, postal_code, city, phone, email, vat_number, active, tenant_id)
VALUES (
    4,
    'STORE-LYON-01',
    'Boutique & Atelier Lyon Presqu''île',
    '98765432100019',
    '12 Rue Édouard Herriot',
    '69002',
    'Lyon',
    '04 78 37 00 00',
    'lyon@joaillerie-dubois.fr',
    'FR98987654321',
    TRUE,
    2
) ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id;

INSERT INTO stores (id, code, name, siret, address, postal_code, city, phone, email, vat_number, active, tenant_id)
VALUES (
    5,
    'STORE-BORDEAUX-01',
    'Boutique Bordeaux Triangle d''Or',
    '98765432100027',
    '8 Cours Georges Clemenceau',
    '33000',
    'Bordeaux',
    '05 56 44 00 00',
    'bordeaux@joaillerie-dubois.fr',
    'FR98987654321',
    TRUE,
    2
) ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id;

-- 5. Initialisation des compteurs de séquences fiscales (NF525) pour tous les magasins
INSERT INTO fiscal_sequence_counter (sequence_type, store_id, current_value, updated_at)
VALUES 
    ('JET_AUDIT', 1, 0, CURRENT_TIMESTAMP),
    ('TICKET_VENTE', 1, 0, CURRENT_TIMESTAMP),
    ('LIVRE_POLICE', 1, 0, CURRENT_TIMESTAMP),
    ('CLOTURE_Z', 1, 0, CURRENT_TIMESTAMP),

    ('JET_AUDIT', 2, 0, CURRENT_TIMESTAMP),
    ('TICKET_VENTE', 2, 0, CURRENT_TIMESTAMP),
    ('LIVRE_POLICE', 2, 0, CURRENT_TIMESTAMP),
    ('CLOTURE_Z', 2, 0, CURRENT_TIMESTAMP),

    ('JET_AUDIT', 3, 0, CURRENT_TIMESTAMP),
    ('TICKET_VENTE', 3, 0, CURRENT_TIMESTAMP),
    ('LIVRE_POLICE', 3, 0, CURRENT_TIMESTAMP),
    ('CLOTURE_Z', 3, 0, CURRENT_TIMESTAMP),

    ('JET_AUDIT', 4, 0, CURRENT_TIMESTAMP),
    ('TICKET_VENTE', 4, 0, CURRENT_TIMESTAMP),
    ('LIVRE_POLICE', 4, 0, CURRENT_TIMESTAMP),
    ('CLOTURE_Z', 4, 0, CURRENT_TIMESTAMP),

    ('JET_AUDIT', 5, 0, CURRENT_TIMESTAMP),
    ('TICKET_VENTE', 5, 0, CURRENT_TIMESTAMP),
    ('LIVRE_POLICE', 5, 0, CURRENT_TIMESTAMP),
    ('CLOTURE_Z', 5, 0, CURRENT_TIMESTAMP)
ON CONFLICT (sequence_type, store_id) DO NOTHING;

-- 6. Synchronisation des séquences PostgreSQL
SELECT setval(pg_get_serial_sequence('tenants', 'id'), COALESCE((SELECT MAX(id) FROM tenants), 1));
SELECT setval(pg_get_serial_sequence('stores', 'id'), COALESCE((SELECT MAX(id) FROM stores), 1));
