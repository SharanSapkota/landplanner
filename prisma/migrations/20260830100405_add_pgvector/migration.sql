-- Enable pgvector and add the embedding column to DocumentChunk.
-- This column is intentionally NOT represented in schema.prisma (Prisma
-- cannot natively type pgvector columns). All reads/writes against it must
-- go through $queryRaw/$executeRaw. See CLAUDE.md section 8.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "DocumentChunk"
ADD COLUMN "embedding" vector(1536);

CREATE INDEX "DocumentChunk_embedding_idx"
ON "DocumentChunk"
USING ivfflat ("embedding" vector_cosine_ops);
