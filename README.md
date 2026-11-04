# ERP Bijoux - Refonte Moderne de l'ERP Bijou3 (Odeis)

Progiciel ERP & Point de Vente (POS) nouvelle génération pour la bijouterie, horlogerie, joaillerie et ateliers de fabrication.

---

## 🌟 Points Forts & Spécificités Métier

- **Livre de Police Dématérialisé (CGI art. 537 & 538)** : Registre public officiel sans rupture de séquence avec chaînage cryptographique SHA-256 et contrôle strict d'inaltérabilité.
- **Rachats d'Or & Métaux Précieux** : Estimation au cours spot de l'or, calcul automatisé de la Taxe sur les Métaux Précieux (TMP 11.5%) ou régime général de la plus-value, KYC clients et bons de rachat légaux.
- **Gestion des Comptes-Poids Métaux Fins** : Suivi des soldes d'or fin (999.9‰) et d'argent chez les affineurs et fondeurs (Saamp, Cookson-CLAL, Heimerle) et façonniers.
- **Atelier SAV & Fabrications Sur-Mesure** : Fiches de réparation, pesée contradictoire au dépôt et au retrait, traçabilité des gemmes et métaux confiés.
- **Caisse Enregistreuse Conforme Anti-Fraude TVA** : Encaissement tactile rapide, clôtures Z et X, ventilation de TVA sur marge (art. 297 A du CGI).
- **Intégration Matérielle Locale** : Connexion directe aux balances de précision carats (Mettler Toledo / Ohaus) et imprimantes d'étiquettes bijoux haltères (Zebra ZPL / Citizen EPL).

---

## 🏗️ Architecture Technique (Monorepo)

- **Backend** : Java 21 LTS, Spring Boot 3.3 (Monolithe Modulaire), Spring Data JPA, PostgreSQL 16, Redis 7, RabbitMQ 3.13.
- **Frontend** : TypeScript, React 18, Vite, Tailwind CSS, TanStack Query & Table, Zustand.
- **Agent Matériel Local** : Node.js / TypeScript daemon communicant via RS-232, USB, Raw TCP 9100 et WebSocket.
- **Hébergement Souverain** : Kubernetes et Stockage S3 Scaleway / OVHcloud sur le territoire français (conformité RGPD, DGDDI, immunité US Cloud Act).

---

## 🚀 Démarrage Rapide en Développement

### 1. Lancement de l'Infrastructure Docker

```bash
# Cloner et initialiser l'environnement
cp .env.example .env

# Démarrer la base de données, le cache, RabbitMQ, Mailpit et le simulateur de périphériques
docker compose up -d postgres redis rabbitmq mailpit mock-hardware
```

### 2. Démarrage du Backend

```bash
./gradlew :backend:api-public:bootRun
```
*L'API REST et Swagger sont accessibles sur :* `http://localhost:8080/swagger-ui.html`

### 3. Démarrage des Applications Frontends

```bash
pnpm install
pnpm dev
```
- **Caisse Magasin (POS tactile)** : `http://localhost:3000`
- **Backoffice ERP (Direction & Atelier)** : `http://localhost:3001`
- **Inspecteur d'Emails (Mailpit)** : `http://localhost:8025`
- **Simulateur Périphériques (Mock Scale / ZPL)** : `http://localhost:8089`

---

## 📚 Documentation Technique Détaillée

- [01. Architecture du Dépôt & Structure Monorepo](docs/architecture/01-monorepo-structure.md)
- [02. Environnement Docker Local & Mock Matériel](docs/architecture/02-devops-and-docker.md)
- [03. Stratégie Complète de Migration Odeis Bijou3](docs/architecture/03-migration-odeis-bijou3.md)
- [04. CI/CD, Cloud Souverain & Sécurité](docs/architecture/04-cicd-sovereign-cloud-security.md)
