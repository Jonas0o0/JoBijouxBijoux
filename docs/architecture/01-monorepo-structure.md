# 1. Architecture du Dépôt & Organisation Monorepo

## 1.1 Choix de l'Architecture Monorepo Unifiée

Pour la refonte globale de l'ERP Bijou3, le choix d'un **Monorepo unifié** s'impose par rapport aux dépôts multiples (poly-repo) pour plusieurs raisons critiques :
1. **Cohérence transactionnelle et couplage métier fort** : Les contrats d'API, les modèles de données (ex: format des poids, des titrages d'alliages, des identifiants fiscaux) et les interfaces de caisse évoluent de concert avec le backend et l'agent matériel.
2. **Double écosystème outillé de pointe** :
   - **Backend Java 21 / Spring Boot** orchestré par **Gradle Multi-Projets** (`settings.gradle.kts` et `build.gradle.kts`), garantissant une compilation incrémentale rapide, un cache partagé et des frontières de modules strictes.
   - **Frontend & Agents locaux** orchestrés par **pnpm Workspaces** et **Turborepo** (`turbo.json`), offrant un partage sans faille des composants UI, des types TypeScript générés par OpenAPI et une vitesse d'exécution optimale via cache déporté.
3. **Traçabilité CI/CD et auditabilité juridique** : Une modification du Livre de Police ou du calcul de TVA sur marge peut être tracée dans un commit unique englobant le schéma PostgreSQL, les contrôleurs REST, le composant d'impression de reçu et le test d'intégration Testcontainers.

---

## 1.2 Arborescence Complète et Détaillée du Dépôt

Emplacement racine : `/home/jonas/Documents/ERPBijoux`

```text
/home/jonas/Documents/ERPBijoux/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Pipeline CI principal (Testcontainers, SonarQube, Trivy)
│       └── release.yml                # Déploiement vers staging et production souveraine
├── backend/                           # Monolithe modulaire Spring Boot 3.3 / Java 21
│   ├── Dockerfile.dev                 # Conteneur de développement avec remote debugging (5005)
│   ├── build.gradle.kts               # Configuration racine des sous-modules backend
│   ├── core/                          # Module socle : Entités partagées, Value Objects, Audit
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/core/
│   │       ├── domain/                # Value Objects (Weight, Fineness, Money, Karat)
│   │       ├── security/              # JWT, permissions RBAC (Vendeur, Dirigeant, Horloger)
│   │       └── audit/                 # Enregistrement chaîné SHA-256 (WORM-like)
│   ├── catalog/                       # Gestion du catalogue Bijouterie & Joaillerie
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/catalog/
│   │       ├── domain/                # Articles, Bijoux montés, Pierres précieuses, Métaux
│   │       └── pricing/               # Calculs de marges, cours du jour des métaux
│   ├── pos/                           # Caisse Enregistreuse (Point de Vente)
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/pos/
│   │       ├── domain/                # Ventes, Avoirs, Règlements mixtes, Clôtures Z et X
│   │       └── fiscal/                # Signature conforme NF525 / LNE (anti-fraude TVA)
│   ├── police-book/                   # Livre de Police Dématérialisé (CGI art. 537 & 538)
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/police/
│   │       ├── domain/                # Registre entrées/sorties, numérotation sans rupture
│   │       └── crypto/                # Scellement cryptographique des feuillets de police
│   ├── gold/                          # Module Rachats d'Or aux particuliers
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/gold/
│   │       ├── domain/                # Estimation or usagé, test pierre de touche / spectromètre
│   │       └── tax/                   # Taxe sur les Métaux Précieux (TMP 11,5%) ou Plus-Value
│   ├── workshop/                      # Atelier & SAV (Réparations, Créations sur-mesure)
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/workshop/
│   │       ├── domain/                # Fiches SAV, traçabilité des dépôts clients, devis
│   │       └── gemology/              # Constat d'état des pierres confiées (inclusions, rayures)
│   ├── weight-account/                # Comptes-Poids Métaux Précieux (Affineurs / Façonniers)
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/weightaccount/
│   │       ├── domain/                # Soldes Or Fin chez Saamp, Cookson-CLAL, Heimerle
│   │       └── conversion/            # Conversion titre brut -> titre fin (750 -> 999.9)
│   ├── crm/                           # Gestion de la Relation Client & KYC
│   │   ├── build.gradle.kts
│   │   └── src/main/java/fr/bijoux/erp/crm/
│   │       ├── domain/                # Fiches clients, pièces d'identité scannées (KYC)
│   │       └── loyalty/               # Programmes fidélité, anniversaires, relances révisions
│   └── api-public/                    # Application exécutable Spring Boot & Gateway REST
│       ├── build.gradle.kts
│       └── src/main/java/fr/bijoux/erp/api/
│           ├── ErpBijouxApplication.java
│           ├── controller/            # Contrôleurs REST documentés OpenAPI 3
│           └── websocket/             # Passerelle WebSocket pour flux de pesée temps réel
├── frontend/                          # Applications Web TypeScript (React 18 / Vite / Tailwind)
│   ├── pos-app/                       # Interface Caisse tactile pour les boutiques
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/                       # Vente rapide, encaissement, pesée en direct, lecture code-barre
│   ├── backoffice-app/                # Console de gestion ERP complète (Siège & Direction)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/                       # Livre de Police, stocks, achats, comptes-poids, comptabilité
│   └── shared-ui/                     # Bibliothèque de composants partagés (Design System)
│       ├── package.json
│       └── src/                       # Boutons, modales, pavé numérique de caisse, tableaux triables
├── hardware-agent/                    # Agent local de communication périphérique (Caisse physique)
│   ├── package.json
│   ├── agent/                         # Daemon local (Port série RS-232, USB, Réseau)
│   │   └── src/                       # Drivers : Balances (SICS), Imprimantes bijoux (ZPL/EPL), TPE
│   └── mock-simulator/                # Simulateur de périphériques pour le développement local
│       ├── Dockerfile
│       ├── requirements.txt
│       └── simulator.py               # Émulateur balance Mettler Toledo + imprimante étiquettes port 9100
├── migration/                         # Outils ETL de reprise des données de l'ancien Bijou3 (Odeis)
│   ├── etl-runner/                    # Runner Spring Batch / Java pour migration lourde
│   │   └── build.gradle.kts
│   ├── extractors/                    # Scripts d'extraction des bases legacy (Sybase, Paradox, MSSQL)
│   ├── transformers/                  # Scripts de nettoyage, dédoublonnage et validation
│   │   └── validate_police_continuity.py
│   ├── loaders/                       # Scripts de chargement haute performance (COPY PostgreSQL)
│   ├── sql/                           # Schémas de staging et requêtes de rapprochement
│   │   └── 01_legacy_staging_schema.sql
│   └── reports/                       # Modèles de rapports certifiés de migration contradictoire
├── e-commerce/                        # Connecteurs headless et synchronisation omnicanale
│   ├── package.json
│   └── connectors/                    # Modules de synchronisation Shopify, WooCommerce, PrestaShop
├── deploy/                            # Infrastructure as Code & Déploiement
│   ├── compose/                       # Scripts d'init et manifests Docker Compose
│   │   └── init-db.sql                # Initialisation base principale et base audit WORM
│   ├── k8s/                           # Manifests Kubernetes pour hébergeur souverain
│   │   ├── base/
│   │   └── overlays/production/
│   ├── terraform/                     # Définition infra Scaleway / OVHcloud (Managed K8s, S3, RDS)
│   └── backup/                        # Stratégie de sauvegarde continue
│       ├── wal-g-backup.sh            # Sauvegarde continue PostgreSQL vers S3 chiffré
│       └── restore-pitr.sh            # Restauration Point-In-Time-Recovery (RTO < 1h)
├── docs/                              # Documentation d'architecture, DevOps et juridique
│   ├── architecture/
│   ├── devops/
│   ├── migration/
│   └── legal/                         # Analyse de conformité C.G.I. 537/538 et arrêté du 11 mai 2011
├── .editorconfig                      # Normalisation des indentations et encodages UTF-8
├── .gitignore                         # Filtrage des caches builds et dumps de migration
├── .env.example                       # Variables d'environnement documentées pour dev local
├── docker-compose.yml                 # Stack complète locale (Postgres, Redis, RabbitMQ, Mailpit, Mock)
├── build.gradle.kts                   # Configuration Gradle globale du Monorepo
├── settings.gradle.kts                # Déclaration des modules Java
├── package.json                       # Scripts npm globaux et dépendances de développement
├── pnpm-workspace.yaml                # Définition de l'espace de travail pnpm
└── turbo.json                         # Pipeline de build et mise en cache Turborepo
```

---

## 1.3 Rôle et Matrice des Dépendances entre Modules

| Module Backend | Rôle Principal | Dépendances Externes | Dépendances Internes |
| :--- | :--- | :--- | :--- |
| `:backend:core` | Entités de base, types de données précieux (grammes, carats, titrages), audit immuté | Spring Data JPA, PostgreSQL, BouncyCastle | Aucune |
| `:backend:catalog` | Référentiel articles, gemmes, métaux, fiches produits et tarifs | Spring Data JPA | `:backend:core` |
| `:backend:police-book` | Livre de Police officiel, chaînage cryptographique SHA-256 | BouncyCastle, PostgreSQL | `:backend:core` |
| `:backend:pos` | Caisse tactile, gestion des tickets, encaissements, clôtures fiscales Z | Spring AMQP (RabbitMQ) | `:backend:core`, `:backend:catalog`, `:backend:police-book` |
| `:backend:gold` | Achat d'or d'occasion, cours spot, calcul de la TMP (11.5%) | Spring Data JPA | `:backend:core`, `:backend:police-book`, `:backend:weight-account` |
| `:backend:workshop` | Atelier réparations, fiches SAV, fabrication sur-mesure | Spring Data JPA | `:backend:core`, `:backend:catalog`, `:backend:weight-account` |
| `:backend:weight-account` | Comptes-poids affineurs et façonniers en or fin | Spring Data JPA | `:backend:core` |
| `:backend:crm` | Fiches clients, pièces d'identité dématérialisées (KYC) | Spring Data JPA | `:backend:core` |
| `:backend:api-public` | Point d'entrée HTTP/WS, sécurité JWT, documentation Swagger | Spring Web, Spring Security, Redis, Mailpit | Tous les modules ci-dessus |
