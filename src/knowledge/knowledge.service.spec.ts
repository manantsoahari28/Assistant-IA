import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddDocumentDto } from './dto/add-document.dto';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let prisma: {
    knowledgeBaseDocument: {
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
    documentChunk: {
      create: jest.Mock;
    };
    $executeRawUnsafe: jest.Mock;
    $queryRawUnsafe: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    apiKeyHash: 'hash-123',
    botSystemPrompt: 'Prompt',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      knowledgeBaseDocument: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      documentChunk: {
        create: jest.fn(),
      },
      $executeRawUnsafe: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addDocument', () => {
    it('should split text into chunks, generate embeddings, and mark status as PROCESSED on success', async () => {
      const dto: AddDocumentDto = {
        title: 'Document Test',
        content: 'Court texte pour test',
        sourceUrl: 'https://example.com',
      };

      prisma.knowledgeBaseDocument.create.mockResolvedValue({
        id: 'doc-1',
        tenantId: mockTenant.id,
        title: dto.title,
        status: 'PENDING',
      });

      prisma.documentChunk.create.mockResolvedValue({
        id: 'chunk-1',
        documentId: 'doc-1',
        content: dto.content,
      });

      const mockOpenAi = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: Array(768).fill(0.1) }],
          }),
        },
      };
      (service as any).openai = mockOpenAi;

      prisma.$executeRawUnsafe.mockResolvedValue(1);
      prisma.knowledgeBaseDocument.update.mockResolvedValue({
        id: 'doc-1',
        status: 'PROCESSED',
      });

      const result = await service.addDocument(mockTenant, dto);

      expect(prisma.knowledgeBaseDocument.create).toHaveBeenCalled();
      expect(prisma.documentChunk.create).toHaveBeenCalled();
      expect(mockOpenAi.embeddings.create).toHaveBeenCalled();
      expect(prisma.$executeRawUnsafe).toHaveBeenCalled();
      expect(prisma.knowledgeBaseDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: 'PROCESSED' },
      });
      expect(result.documentId).toBe('doc-1');
      expect(result.chunksCreated).toBe(1);
    });

    it('should mark document status as FAILED when embedding generation fails', async () => {
      const dto: AddDocumentDto = {
        title: 'Document Fail',
        content: 'Court texte qui va echouer',
      };

      prisma.knowledgeBaseDocument.create.mockResolvedValue({
        id: 'doc-fail-1',
        tenantId: mockTenant.id,
        title: dto.title,
        status: 'PENDING',
      });

      prisma.documentChunk.create.mockResolvedValue({
        id: 'chunk-fail-1',
        documentId: 'doc-fail-1',
        content: dto.content,
      });

      const mockOpenAi = {
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
        },
      };
      (service as any).openai = mockOpenAi;

      prisma.knowledgeBaseDocument.update.mockResolvedValue({
        id: 'doc-fail-1',
        status: 'FAILED',
      });

      const result = await service.addDocument(mockTenant, dto);

      expect(prisma.knowledgeBaseDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-fail-1' },
        data: { status: 'FAILED' },
      });
      expect(result.status).toBe('FAILED');
    });
  });

  describe('findAllDocuments', () => {
    it('should return documents with chunk counts', async () => {
      const docs = [
        {
          id: 'doc-1',
          tenantId: mockTenant.id,
          title: 'Doc 1',
          _count: { chunks: 3 },
        },
      ];
      prisma.knowledgeBaseDocument.findMany.mockResolvedValue(docs);

      const result = await service.findAllDocuments(mockTenant.id);

      expect(prisma.knowledgeBaseDocument.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenant.id },
        include: { _count: { select: { chunks: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(docs);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document when found', async () => {
      prisma.knowledgeBaseDocument.findFirst.mockResolvedValue({
        id: 'doc-1',
        tenantId: mockTenant.id,
      });
      prisma.knowledgeBaseDocument.delete.mockResolvedValue({ id: 'doc-1' });

      const result = await service.deleteDocument(mockTenant.id, 'doc-1');

      expect(prisma.knowledgeBaseDocument.delete).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(result).toEqual({
        message: 'Document supprimé avec succès',
        documentId: 'doc-1',
      });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      prisma.knowledgeBaseDocument.findFirst.mockResolvedValue(null);

      await expect(service.deleteDocument(mockTenant.id, 'doc-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchSimilarChunks', () => {
    it('should return chunks contents on success', async () => {
      const mockOpenAi = {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
          }),
        },
      };
      (service as any).openai = mockOpenAi;

      prisma.$queryRawUnsafe.mockResolvedValue([
        { content: 'Chunk pertinent 1' },
        { content: 'Chunk pertinent 2' },
      ]);

      const result = await service.searchSimilarChunks(mockTenant.id, 'question support', 2);

      expect(mockOpenAi.embeddings.create).toHaveBeenCalled();
      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toEqual(['Chunk pertinent 1', 'Chunk pertinent 2']);
    });

    it('should return empty array when an error occurs during search', async () => {
      const mockOpenAi = {
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('Embedding search failed')),
        },
      };
      (service as any).openai = mockOpenAi;

      const result = await service.searchSimilarChunks(mockTenant.id, 'query');

      expect(result).toEqual([]);
    });
  });
});
