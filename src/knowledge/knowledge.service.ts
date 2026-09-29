// src/knowledge/knowledge.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '@prisma/client';
import OpenAI from 'openai';
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

        // Mise à jour directe dans PostgreSQL via pgvector
        const vectorString = `[${embedding.join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
          vectorString,
          chunk.id,
        );
      } catch (err) {
        console.error('Erreur lors de la génération du vecteur :', err);
      }
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

  // Méthode de recherche par similarité cosinus (RAG)
  async searchSimilarChunks(tenantId: string, query: string, limit = 3): Promise<string[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'gemini-embedding-001',
        input: query,
        dimensions: 768,
      });

      const queryVector = `[${response.data[0].embedding.join(',')}]`;

      // Recherche vectorielle par distance cosinus (<=>) filtrée par Tenant
      const result: Array<{ content: string }> = await this.prisma.$queryRawUnsafe(
        `SELECT content 
         FROM "DocumentChunk"
         WHERE "tenantId" = $1 AND embedding IS NOT NULL
         ORDER BY embedding <=> $2::vector
         LIMIT $3;`,
        tenantId,
        queryVector,
        limit,
      );

      return result.map((r) => r.content);
    } catch (e) {
      console.error('Erreur de recherche vectorielle:', e);
      return [];
    }
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