# Assistant-IA

> **Plateforme de support client multi-tenant combinant génération augmentée par la récupération (RAG) et collaboration humain-IA.**

[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)](./LICENSE)

---

## Table des matières

- [Vue d ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancer le projet](#lancer-le-projet)
- [API Reference](#api-reference)
- [Cycle de vie des conversations](#cycle-de-vie-des-conversations)
- [Base de connaissances and RAG](#base-de-connaissances-et-rag)
- [Multi-tenancy and Sécurité](#multi-tenancy-et-sécurité)
- [Structure du projet](#structure-du-projet)
- [Tests](#tests)
- [Décisions d architecture (ADR)](#décisions-darchitecture-adr)

---

## Vue d ensemble

**Assistant-IA** est une plateforme de support client entreprise qui élimine deux risques majeurs de l automatisation :

| Risque | Solution apportée |
|--------|-------------------|
| **Hallucination IA** | Chaque réponse du bot est strictement ancrée dans des documents de connaissance vectorisés via `pgvector` (cosine similarity) |
| **Boucles sans issue** | Transitions d état déterministes `BOT → PENDING_HUMAN → HUMAN_ACTIVE → CLOSED` avec zéro perte de contexte |

La plateforme expose **deux surfaces** depuis un unique backend NestJS :

- 🖥️ **Workspace Counselor** — Console opérationnelle interne pour les conseillers (triage, prise en charge, résolution)
- 💬 **Widget Embeddable** — Interface de chat flottante intégrée sur les sites clients

---

## Architecture

```
+----------------------------------------------------------+
|                 Frontend (Vite + React 19)               |
|                                                          |
|  +----------------------+   +----------------------+     |
|  | Counselor Workspace  |   | Embeddable Widget    |     |
|  | (Triage, Prise en   |   | (Chat client léger)  |     |
|  |  charge, RAG view)  |   +----------------------+     |
|  +----------------------+                                |
+-------------------------+--------------------------------+
                          | REST API (x-api-key)
+-------------------------v--------------------------------+
|                NestJS Backend (port 3000)                |
|                                                          |
|  +----------+  +-----------+  +--------+  +----------+  |
|  |   Chat   |  | Knowledge |  | Tenant |  |   Auth   |  |
|  |  Module  |  |  Module   |  | Module |  |  Module  |  |
|  +-----+----+  +-----+-----+  +--------+  +----------+  |
|        |             |                                   |
|  +-----v-------------v----------------------------------+ |
|  |           Google Gemini API                         | |
|  |  gemini-2.5-flash-lite (gen) + text-embedding-004  | |
|  +-----------------------------------------------------+ |
+-------------------------+--------------------------------+
                          | Prisma ORM
+-------------------------v--------------------------------+
|          PostgreSQL + pgvector (Supabase)                |
|                                                          |
|  Tenants | Conversations | Messages | KnowledgeDocs      |
|  DocumentChunks | DocumentChunkVectors (vector 768)      |
+----------------------------------------------------------+
```

---

## Stack technique

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **NestJS** | 12 | Framework backend modulaire |
| **TypeScript** | 6 | Typage statique |
| **Prisma ORM** | 6 | Accès base de données + migrations |
| **PostgreSQL + pgvector** | — | Base relationnelle + recherche vectorielle |
| **Google Gemini API** | — | LLM (`gemini-2.5-flash-lite`) + embeddings (`text-embedding-004`, 768 dims) |
| **Swagger / OpenAPI** | — | Documentation API interactive (`/api`) |
| **Jest** | 30 | Tests unitaires et d intégration |
| **oxlint** | — | Linting rapide |

### Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Vite** | 8 | Build tool et dev server |
| **React** | 19 | UI SPA dual-surface |
| **TypeScript** | 6 | Typage statique |
| **Tailwind CSS** | 4 | Styles utilitaires |
| **Radix UI** | — | Composants accessibles (Dialog, Tabs, Tooltip, Dropdown) |
| **Lucide React** | — | Icônes |

---

## Prérequis

- **Node.js** >= 20 LTS
- **npm** >= 10
- **PostgreSQL** avec l extension `pgvector` activée (ou un compte [Supabase](https://supabase.com/))
- **Clé API Google Gemini** — [Obtenir une clé](https://ai.google.dev/)

---

## Installation

```bash
# 1. Cloner le dépôt
git clone <URL_DU_DEPOT>
cd support-ia

# 2. Installer les dépendances backend (génère aussi le client Prisma)
npm install

# 3. Installer les dépendances frontend
npm install --prefix frontend
```

---

## Configuration

Créer un fichier `.env` à la racine en vous basant sur ce modèle :

```env
# URL avec pgBouncer (pooling) — utilisée par l application en exécution (port 6543)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?sslmode=require&pgbouncer=true"

# URL directe — utilisée par Prisma pour les migrations et prisma db push (port 5432)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"

# Clé API Google Gemini
GEMINI_API_KEY="votre_cle_api_gemini"
```

> **Attention** : Ne commitez jamais votre fichier `.env`. Il est inclus dans `.gitignore`.

### Initialiser la base de données

```bash
# Appliquer le schéma Prisma à la base de données
npx prisma db push

# (Optionnel) Insérer des données de test
npx prisma db seed
```

---

## Lancer le projet

### Développement — backend + frontend simultanément

```bash
npm run dev
```

Lance en parallèle :
- **Backend NestJS** en mode watch sur `http://localhost:3000`
- **Frontend Vite** sur `http://localhost:5173`

### Lancer séparément

```bash
# Backend uniquement
npm run dev:backend

# Frontend uniquement
npm run dev:frontend
```

### Production

```bash
npm run build
npm run start:prod
```

### Accès rapide

| Surface | URL |
|---------|-----|
| Workspace Counselor | `http://localhost:5173` |
| Documentation API Swagger | `http://localhost:3000/api` |
| API Backend | `http://localhost:3000` |

---

## API Reference

Toutes les routes exigent l en-tête d authentification :

```
x-api-key: <cle_api_du_tenant>
```

La documentation Swagger interactive complète est disponible sur `/api`.

### Module Chat — `/chat`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/chat/conversations` | Créer une nouvelle conversation |
| `GET` | `/chat/conversations` | Lister les conversations du tenant |
| `GET` | `/chat/conversations/:id` | Détail d une conversation avec ses messages |
| `POST` | `/chat/conversations/:id/messages` | Envoyer un message customer (IA répond en état BOT) |
| `POST` | `/chat/conversations/:id/escalate` | Escalader manuellement vers PENDING_HUMAN |
| `POST` | `/chat/conversations/:id/take-over` | Conseiller prend en charge (HUMAN_ACTIVE) |
| `POST` | `/chat/conversations/:id/agent-message` | Envoyer un message de conseiller |
| `POST` | `/chat/conversations/:id/resolve` | Résoudre ou renvoyer au bot |

### Module Knowledge — `/knowledge`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/knowledge/documents` | Uploader un document (texte brut ou PDF) |
| `GET` | `/knowledge/documents` | Lister les documents du tenant |
| `DELETE` | `/knowledge/documents/:id` | Supprimer un document et ses chunks vectoriels |

### Module Tenant — `/tenant`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/tenant/settings` | Récupérer les paramètres du tenant |
| `PATCH` | `/tenant/settings` | Mettre à jour nom et prompt système du bot |

---

## Cycle de vie des conversations

```
             +-------------+
             |     BOT     |  <-- État initial
             | (IA répond) |
             +------+------+
                    |  escalation (manuelle, customer request,
                    |  ou signal [ESCALATE_TO_HUMAN] du LLM)
             +------v------+
             |PENDING_HUMAN|  <-- File d attente triage
             +------+------+
                    |  take-over conseiller
             +------v------+
             |HUMAN_ACTIVE |  <-- Conseiller actif (bot muet)
             +------+------+
                    |  resolve()
        +-----------+-----------+
        |                       |
        | returnToBot: false    | returnToBot: true
+-------v-------+       +-------v-------+
|   RESOLVED    |       |      BOT      |
| (24h cooldown)|       | (reprise IA)  |
+-------+-------+       +---------------+
        |  expiration / confirmation
+-------v-------+
|    CLOSED     |  <-- État terminal immuable
+---------------+
```

**Règles clés :**
- En état `BOT`, la mémoire conversationnelle couvre les **10 derniers messages**
- L escalade automatique se déclenche si le bot émet `[ESCALATE_TO_HUMAN]` ou si la récupération est insuffisante
- En état `HUMAN_ACTIVE`, le bot est **entièrement désactivé**
- `CLOSED` est **immuable** — toute nouvelle demande ouvre une nouvelle conversation

---

## Base de connaissances et RAG

### Pipeline d ingestion

```
Document texte / PDF
        |
        v
  Extraction texte (pdf-parse)
        |
        v
  Découpage en chunks (~500 caractères)
        |
        v
  Embeddings vectoriels (text-embedding-004, 768 dims)
        |
        v
  Stockage PostgreSQL + pgvector (index HNSW)
  Statut : PENDING --> PROCESSED | FAILED
```

### Recherche vectorielle à chaque message BOT

1. Génération de l embedding de la question customer
2. Recherche cosinus sur `DocumentChunkVector` **filtrée par `tenantId`**
3. Injection des chunks pertinents dans le prompt système Gemini
4. Réponse **uniquement** à partir de ces chunks — si aucun chunk pertinent : escalade automatique

---

## Multi-tenancy et Sécurité

| Mécanisme | Description |
|-----------|-------------|
| **Isolation stricte** | Chaque requête SQL, embedding et index est filtré par `tenantId` |
| **Authentification** | Clé API via `x-api-key`, vérifiée contre le hash SHA-256 (`apiKeyHash`) |
| **Stockage sécurisé** | Seul le digest SHA-256 irréversible est persisté — jamais la clé en clair |
| **Cascade de suppression** | La suppression d un tenant supprime toutes ses données associées |

---

## Structure du projet

```
support-ia/
├── src/                          # Code source backend NestJS
│   ├── auth/                     # Middleware x-api-key
│   ├── chat/                     # Conversations, messages, handoff RAG
│   │   ├── dto/                  # Data Transfer Objects (validation)
│   │   ├── chat.controller.ts
│   │   └── chat.service.ts       # Logique RAG, transitions d état, Gemini
│   ├── knowledge/                # Ingestion documents, chunks, embeddings
│   │   ├── knowledge.controller.ts
│   │   └── knowledge.service.ts
│   ├── tenant/                   # Paramètres tenant, prompt système
│   ├── prisma/                   # Service Prisma partagé
│   └── main.ts                   # Bootstrap + Swagger
├── frontend/                     # Frontend Vite + React 19
│   └── src/
│       ├── workspace/            # Counselor Workspace
│       └── widget/               # Embeddable Customer Widget
├── prisma/
│   ├── schema.prisma             # Schéma PostgreSQL + pgvector
│   └── seed.ts                   # Données de test
├── docs/
│   └── adr/                      # Architectural Decision Records (0001-0007)
├── test/                         # Tests e2e
├── CONTEXT.md                    # Vocabulaire métier canonique
├── PRODUCT.md                    # Vision produit et contraintes
└── .env                          # Variables d environnement (non versionné)
```

---

## Tests

```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm run test:cov

# Tests e2e
npm run test:e2e

# Linting
npm run lint

# Formatage
npm run format
```

---

## Décisions d architecture (ADR)

| ADR | Décision |
|-----|----------|
| [0001](./docs/adr/0001-vite-react-spa-dual-surface.md) | Vite + React SPA pour les deux surfaces (Workspace et Widget) |
| [0002](./docs/adr/0002-decoupled-pgvector-hnsw-table.md) | Table `DocumentChunkVector` découplée avec index HNSW |
| [0003](./docs/adr/0003-two-tier-escalation-tool-calling.md) | Escalade en deux niveaux via tool calling Gemini |
| [0004](./docs/adr/0004-head-and-tail-context-budgeting.md) | Budgetisation head+tail de la mémoire conversationnelle |
| [0005](./docs/adr/0005-escalate-to-counselor-tool-schema.md) | Schéma du tool `escalate_to_counselor` |
| [0006](./docs/adr/0006-hybrid-courtesy-filter-resolved-conversations.md) | Filtre de courtoisie hybride pour conversations résolues |
| [0007](./docs/adr/0007-denormalized-tenant-id-vector-isolation.md) | `tenantId` dénormalisé dans `DocumentChunkVector` pour l isolation vectorielle |

---

## Modèle de données

```
Tenant (1) --< KnowledgeBaseDocument (1) --< DocumentChunk (1) --< DocumentChunkVector
                                                                     (embedding vector(768))

Tenant (1) --< Conversation (1) --< Message
                   |
                   +-- status   : BOT | PENDING_HUMAN | HUMAN_ACTIVE | RESOLVED | CLOSED
                   +-- category : BUG | QUESTION | RECLAMATION
                   +-- role     : USER | ASSISTANT | SYSTEM
```

---

<div align="center">

**Assistant-IA** — Sujet 4 · Backend pour assistant de support client basé sur une IA

*NestJS · React · pgvector · Google Gemini*

</div>
