-- V6: Insertion de la boutique principale par défaut pour les tests
INSERT INTO stores (id, code, name, siret, address, postal_code, city, phone, email, vat_number, active)
VALUES (
    1,
    'STORE-PARIS-01',
    'Bijouterie Joaillerie Place Vendôme',
    '12345678900012',
    '1 Place Vendôme',
    '75001',
    'Paris',
    '01 42 68 00 00',
    'contact@bijoux-vendome.fr',
    'FR12123456789',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Initialisation des compteurs de séquences fiscales pour ce magasin
INSERT INTO fiscal_sequence_counter (sequence_type, store_id, current_value, updated_at)
VALUES 
    ('JET_AUDIT', 1, 0, CURRENT_TIMESTAMP),
    ('TICKET_VENTE', 1, 0, CURRENT_TIMESTAMP),
    ('LIVRE_POLICE', 1, 0, CURRENT_TIMESTAMP),
    ('CLOTURE_Z', 1, 0, CURRENT_TIMESTAMP)
ON CONFLICT (sequence_type, store_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('stores', 'id'), COALESCE((SELECT MAX(id) FROM stores), 1));
