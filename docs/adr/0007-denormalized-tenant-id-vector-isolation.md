# 0007. Denormalized Tenant Isolation on Vector Indexes

We chose to denormalize `tenantId` directly onto the `DocumentChunkVector` table and enforce composite indexing alongside the pgvector HNSW index.

In pgvector, nearest-neighbor searches that filter by foreign keys via JOIN clauses force PostgreSQL to either scan external vector clusters blindly before filtering (causing poor recall or slow post-filtering) or perform expensive sequential table scans. Denormalizing `tenantId` directly onto the vector table enables pgvector's index filter pushdown at index traversal time, mathematically preventing cross-tenant vector contamination while keeping retrieval latency sub-10ms.
