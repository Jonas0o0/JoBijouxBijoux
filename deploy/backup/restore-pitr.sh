#!/bin/bash
# ==============================================================================
# Procédure de Restauration Point-In-Time-Recovery (PITR) PostgreSQL
# Objectif RTO : < 1 heure
# ==============================================================================

set -euo pipefail

TARGET_TIME="${1:-}" # Ex: "2026-11-04 14:30:00"

if [ -z "$TARGET_TIME" ]; then
    echo "Usage: $0 \"YYYY-MM-DD HH:MM:SS\" (Timestamp de restauration souhaité)"
    exit 1
fi

echo "[$(date -Is)] Arrêt du service PostgreSQL..."
systemctl stop postgresql || docker stop erp_bijoux_postgres

echo "[$(date -Is)] Purge du répertoire de données actuel..."
rm -rf /var/lib/postgresql/data/*

echo "[$(date -Is)] Récupération du dernier Basebackup depuis S3 Souverain..."
wal-g backup-fetch /var/lib/postgresql/data LATEST

echo "[$(date -Is)] Configuration du signal de restauration PITR..."
cat <<EOF > /var/lib/postgresql/data/recovery.signal
# Signal PITR activé
EOF

cat <<EOF >> /var/lib/postgresql/data/postgresql.auto.conf
restore_command = 'wal-g wal-fetch "%f" "%p"'
recovery_target_time = '${TARGET_TIME}'
recovery_target_action = 'promote'
EOF

chown -R postgres:postgres /var/lib/postgresql/data
chmod 700 /var/lib/postgresql/data

echo "[$(date -Is)] Démarrage de PostgreSQL pour application des WAL jusqu'à $TARGET_TIME..."
systemctl start postgresql || docker start erp_bijoux_postgres

echo "[$(date -Is)] Restauration PITR terminée avec succès. Vérifier les logs PostgreSQL."
