import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '@prisma/client';
import { TenantGuard } from '../auth/tenant.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AddDocumentDto } from './dto/add-document.dto';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeController', () => {
  let controller: KnowledgeController;
  let knowledgeService: {
    addDocument: jest.Mock;
    findAllDocuments: jest.Mock;
    deleteDocument: jest.Mock;
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
    knowledgeService = {
      addDocument: jest.fn(),
      findAllDocuments: jest.fn(),
      deleteDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KnowledgeController],
      providers: [
        { provide: KnowledgeService, useValue: knowledgeService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KnowledgeController>(KnowledgeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addDocument', () => {
    it('should call knowledgeService.addDocument and return the result', async () => {
      const dto: AddDocumentDto = {
        title: 'Guide FAQ',
        content: 'Contenu du guide FAQ pour tester RAG',
        sourceUrl: 'https://example.com/faq',
      };

      const expectedResponse = {
        message: 'Document ingéré et vectorisé avec succès',
        documentId: 'doc-123',
        chunksCreated: 1,
      };

      knowledgeService.addDocument.mockResolvedValue(expectedResponse);

      const result = await controller.addDocument(mockTenant, dto);

      expect(knowledgeService.addDocument).toHaveBeenCalledWith(mockTenant, dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findAll', () => {
    it('should return all documents for the tenant', async () => {
      const expectedDocs = [
        {
          id: 'doc-1',
          tenantId: mockTenant.id,
          title: 'Doc 1',
          sourceUrl: null,
          status: 'PROCESSED',
          createdAt: new Date(),
          _count: { chunks: 2 },
        },
      ];

      knowledgeService.findAllDocuments.mockResolvedValue(expectedDocs);

      const result = await controller.findAll(mockTenant);

      expect(knowledgeService.findAllDocuments).toHaveBeenCalledWith(mockTenant.id);
      expect(result).toEqual(expectedDocs);
    });
  });

  describe('delete', () => {
    it('should call knowledgeService.deleteDocument and return confirmation', async () => {
      const expectedResponse = {
        message: 'Document supprimé avec succès',
        documentId: 'doc-1',
      };

      knowledgeService.deleteDocument.mockResolvedValue(expectedResponse);

      const result = await controller.delete(mockTenant, 'doc-1');

      expect(knowledgeService.deleteDocument).toHaveBeenCalledWith(mockTenant.id, 'doc-1');
      expect(result).toEqual(expectedResponse);
    });
  });
});
