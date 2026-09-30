# 0002. Decoupled pgvector Storage with Dedicated HNSW Index

We chose to store embedding vectors in a dedicated `DocumentChunkVector` PostgreSQL table indexed with native `HNSW` (`vector_cosine_ops`), rather than inlining vectors directly into the `DocumentChunk` entity or using an external vector database.

Inlining 768-dimensional float arrays (approx. 3 KB each) inside `DocumentChunk` causes Postgres TOAST page bloat and degrades sequential chunk reads during text retrieval. A decoupled table retains full relational ACID consistency and tenant isolation within our primary PostgreSQL database while unlocking sub-millisecond approximate nearest neighbor searches via HNSW without operational overhead from a separate vector database.
