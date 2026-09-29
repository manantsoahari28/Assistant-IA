# CONTEXTE DU PROJET
Je développe une application backend de support client multi-tenant RAG sous NestJS, TypeScript et Prisma.
- L'isolation multi-tenant est gérée via `TenantGuard` et le décorateur `@CurrentTenant() tenant: Tenant`.
- Le modèle Prisma `Tenant` contient : `id`, `name`, `apiKey`, `botSystemPrompt`, `createdAt`, `updatedAt`.
- Le modèle Prisma `KnowledgeBaseDocument` contient : `id`, `tenantId`, `title`, `sourceUrl`, `status`, `createdAt`, `updatedAt` et possède une relation avec `chunks` (`DocumentChunk[]`).

# OBJECTIF
Implémenter le module d'administration pour :
1. Gérer la base de connaissances en CRUD (lister et supprimer des documents).
2. Créer un module de gestion des paramètres du Tenant (`TenantModule`) pour lire et modifier les informations du bot (ex: `botSystemPrompt`).