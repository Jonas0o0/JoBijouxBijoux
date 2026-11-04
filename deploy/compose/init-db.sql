-- Initialization Script for ERP Bijoux (Main DB & Tamper-Evident Audit DB)

-- 1. Create main databases if not exists
CREATE DATABASE erp_bijoux_audit;

-- Connect to main database
\c erp_bijoux;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Connect to audit database
\c erp_bijoux_audit;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table for Police Book & Fiscal WORM / Audit Log
CREATE TABLE IF NOT EXISTS security_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    terminal_id VARCHAR(50),
    store_code VARCHAR(20),
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    signature_ecdsa TEXT
);

CREATE INDEX idx_audit_timestamp ON security_audit_log(event_timestamp);
CREATE INDEX idx_audit_entity ON security_audit_log(entity_name, entity_id);
