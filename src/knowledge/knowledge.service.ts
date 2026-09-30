// src/knowledge/knowledge.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '@prisma/client';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service';
import { AddDocumentDto } from './dto/add-document.dto';

@Injectable()
export class KnowledgeService {
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: this.configService.get('GEMINI_API_KEY') || 'dummy-key',
    });
  }

  async addDocument(tenant: Tenant, dto: AddDocumentDto) {
    // 1. Enregistrer le document source
    const doc = await this.prisma.knowledgeBaseDocument.create({
      data: {
        tenantId: tenant.id,
        title: dto.title,
        sourceUrl: dto.sourceUrl,
        status: 'PENDING',
      },
    });

    // 2. Découper le contenu en morceaux (Chunks) d'environ 500 caractères
    const chunksText = this.splitTextIntoChunks(dto.content, 500);

    let hasFailed = false;

    // 3. Traiter chaque morceau et insérer dans la base
    for (const chunkText of chunksText) {
      const chunk = await this.prisma.documentChunk.create({
        data: {
          tenantId: tenant.id,
          documentId: doc.id,
          content: chunkText,
        },
      });

      // Génération de l'embedding via l'API Gemini
      try {
        const embeddingResponse = await this.openai.embeddings.create({
          model: 'gemini-embedding-001',
          input: chunkText,
          dimensions: 768,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Mise à jour dans la table découplée DocumentChunkVector (ADR 0002 & ADR 0007)
        // et rétro-compatibilité sur DocumentChunk
        const vectorString = `[${embedding.join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "document_chunk_vectors" ("id", "tenantId", "chunkId", "embedding", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3::vector, NOW())
           ON CONFLICT ("chunkId") DO UPDATE SET "embedding" = $3::vector`,
          tenant.id,
          chunk.id,
          vectorString,
        );

        // Maintenir le champ rétro-compatible sur DocumentChunk
        await this.prisma.$executeRawUnsafe(
          `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          vectorString,
          chunk.id,
        );
      } catch (err) {
        console.error('Erreur lors de la génération du vecteur :', err);
        hasFailed = true;
        break;
      }
    }

    if (hasFailed) {
      await this.prisma.knowledgeBaseDocument.update({
        where: { id: doc.id },
        data: { status: 'FAILED' },
      });

      return {
        message: 'Échec de la génération des embeddings pour le document',
        documentId: doc.id,
        status: 'FAILED',
        chunksCreated: chunksText.length,
      };
    }

    // 4. Marquer le document comme traité
    await this.prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { status: 'PROCESSED' },
    });

    return {
      message: 'Document ingéré et vectorisé avec succès',
      documentId: doc.id,
      chunksCreated: chunksText.length,
    };
  }

  /**
   * Récupère tous les documents associés au tenantId avec le nombre de chunks créés
   */
  async findAllDocuments(tenantId: string) {
    return this.prisma.knowledgeBaseDocument.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Supprime un document s'il appartient bien au tenant (cascade delete sur DocumentChunk)
   */
  async deleteDocument(tenantId: string, documentId: string) {
    const document = await this.prisma.knowledgeBaseDocument.findFirst({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document introuvable ou non autorisé');
    }

    await this.prisma.knowledgeBaseDocument.delete({
      where: { id: documentId },
    });

    return {
      message: 'Document supprimé avec succès',
      documentId,
    };
  }

  /**
   * Recherche vectorielle avec score de similarité cosinus (ADR 0002 & ADR 0007)
   * Exploite l'index HNSW et le pushdown du tenant_id sur document_chunk_vectors.
   */
  async searchSimilarChunksWithScores(
    tenantId: string,
    query: string,
    limit = 3,
  ): Promise<Array<{ content: string; similarity: number }>> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'gemini-embedding-001',
        input: query,
        dimensions: 768,
      });

      const queryVector = `[${response.data[0].embedding.join(',')}]`;

      // Requête prioritaire sur la table découplée avec pushdown sur v."tenantId"
      try {
        const result: Array<{ content: string; similarity: number }> =
          await this.prisma.$queryRawUnsafe(
            `SELECT c.content, (1 - (v.embedding <=> $2::vector)) as similarity
             FROM "document_chunk_vectors" v
             JOIN "DocumentChunk" c ON c.id = v."chunkId"
             WHERE v."tenantId" = $1
             ORDER BY v.embedding <=> $2::vector
             LIMIT $3;`,
            tenantId,
            queryVector,
            limit,
          );

        if (result && result.length > 0) {
          return result.map((r) => ({
            content: r.content,
            similarity: Number(r.similarity),
          }));
        }
      } catch (tableErr) {
        // Fallback si la table découplée n'est pas encore créée dans l'environnement courant
        console.warn('Table document_chunk_vectors non accessible, fallback sur DocumentChunk', tableErr);
      }

      // Fallback rétro-compatible sur DocumentChunk direct
      const fallbackResult: Array<{ content: string }> =
        await this.prisma.$queryRawUnsafe(
          `SELECT content 
           FROM "DocumentChunk"
           WHERE "tenantId" = $1 AND embedding IS NOT NULL
           ORDER BY embedding <=> $2::vector
           LIMIT $3;`,
          tenantId,
          queryVector,
          limit,
        );

      return fallbackResult.map((r) => ({
        content: r.content,
        similarity: 1.0, // Score par défaut en mode fallback
      }));
    } catch (e) {
      console.error('Erreur de recherche vectorielle:', e);
      return [];
    }
  }

  // Méthode de recherche par similarité cosinus (RAG)
  async searchSimilarChunks(tenantId: string, query: string, limit = 3): Promise<string[]> {
    const scoredChunks = await this.searchSimilarChunksWithScores(tenantId, query, limit);
    return scoredChunks.map((c) => c.content);
  }

  async addPdfDocument(
    tenant: Tenant,
    buffer: Buffer,
    filename: string,
    customTitle?: string,
  ) {
    let extractedText = '';
    const parser = new (PDFParse as any)({ data: buffer });
    try {
      const result = await parser.getText();
      extractedText = (result.text || '').trim();
    } catch (err) {
      console.error('Erreur lors du parsing du PDF :', err);
      throw new BadRequestException('Impossible d’extraire le texte du document PDF');
    } finally {
      await parser.destroy();
    }

    if (!extractedText) {
      throw new BadRequestException(
        'Le document PDF ne contient aucun texte extractible (il s’agit peut-être d’un PDF numérisé sans OCR)',
      );
    }

    const documentTitle =
      customTitle?.trim() || filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    return this.addDocument(tenant, {
      title: documentTitle,
      content: extractedText,
      sourceUrl: `document://${filename}`,
    });
  }

  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }
}