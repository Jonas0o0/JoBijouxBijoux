#!/usr/bin/env bash
set -e

echo "💎 ====================================================="
echo "💎  Démarrage de la Caisse & PWA Joaillerie ERPBijoux"
echo "💎 ====================================================="

# Ensure pnpm path
export PATH="/home/jonas/.npm-global/bin:$PATH"

# Ensure mock hardware container is running
echo "🔌 Vérification du simulateur matériel (Balance SICS, TPE, ZPL)..."
if ! docker ps --format '{{.Names}}' | grep -q "erp_bijoux_mock_hardware"; then
  echo "🚀 Lancement du conteneur mock-hardware (ports 8089 & 9100)..."
  docker compose up -d mock-hardware
fi
echo "✅ Simulateur matériel prêt sur http://localhost:8089 (WS & HTTP)"

# Start POS Vite application
echo "⚡ Démarrage du serveur Vite POS Joaillerie..."
echo "👉 Ouvrez votre navigateur sur : http://localhost:3000"
echo "👉 Pour tester le mode Smartphone Vendeuse, cliquez sur le bouton 'Mode Vendeuse' ou réduisez la fenêtre"
echo "💎 ====================================================="

cd "$(dirname "$0")/../frontend/pos-app"
pnpm dev
