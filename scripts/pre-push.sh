#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🛡️  VÉRIFICATION PRÉ-PUSH : Exécution automatique des tests"
echo "=========================================================="

# 1. Vérification des tests backend Maven
if [ -f "backend/pom.xml" ]; then
    echo "☕ Lancement des tests Maven du backend Java..."
    mvn -B test -f backend/pom.xml --no-transfer-progress
    echo "✅ Tests backend Maven validés avec succès !"
fi

echo "=========================================================="
echo "🚀 Tous les tests sont au vert. Autorisation du push Git."
echo "=========================================================="
exit 0
