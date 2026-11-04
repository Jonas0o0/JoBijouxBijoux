#!/bin/bash
# ==============================================================================
# Script de Sauvegarde Continue PostgreSQL avec WAL-G vers S3 Souverain (Scaleway / OVH)
# Objectifs : RPO < 15 minutes, Chiffrement AES-256 côté client, Immutabilité WORM
# ==============================================================================

set -euo pipefail

# Configuration S3 Souverain
export WALE_S3_PREFIX="${S3_BACKUP_ENDPOINT:-s3://erp-bijoux-backups-production/wal-g}"
export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}"
export AWS_ENDPOINT="${S3_S3_ENDPOINT:-https://s3.fr-par.scw.cloud}"
export AWS_REGION="fr-par"
export WALG_PG_DATA="/var/lib/postgresql/data"

# Chiffrement asymétrique des archives (Clé PGP / GPG)
export WALG_PGP_KEY_PATH="/etc/wal-g/backup_encryption_key.asc"

echo "[$(date -Is)] Starting WAL-G Full Basebackup..."
wal-g backup-push "$WALG_PG_DATA"

echo "[$(date -Is)] Basebackup successfully pushed to Sovereign S3."

# Rétention : Conserver les 14 derniers jours de sauvegardes complètes et WAL
echo "[$(date -Is)] Cleaning old backups (retention 14 days)..."
wal-g delete retain FULL 14 --confirm

echo "[$(date -Is)] Backup cycle complete."
