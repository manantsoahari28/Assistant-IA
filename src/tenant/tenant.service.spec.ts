import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: {
    tenant: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockTenant = {
    id: 'tenant-uuid-1',
    name: 'Enterprise Corp',
    apiKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    botSystemPrompt: 'Tu es un assistant pro.',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return tenant settings with redacted apiKeyPreview and without plaintext hash', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getSettings('tenant-uuid-1');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-uuid-1' },
        select: expect.any(Object),
      });
      expect(result.id).toBe('tenant-uuid-1');
      expect(result.name).toBe('Enterprise Corp');
      // Vérifier le masquage de sécurité (ADR 0007 / Sécurité)
      expect(result.apiKeyPreview).toBe('sk_...b855');
      expect((result as any).apiKey).toBeUndefined();
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getSettings('unknown-tenant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rotateApiKey', () => {
    it('should generate a new cryptographic key, update the hash, and return the plaintext key once', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.update.mockResolvedValue({ ...mockTenant });

      const result = await service.rotateApiKey('tenant-uuid-1');

      expect(result.apiKey).toMatch(/^sk_live_[0-9a-f]{48}$/);
      expect(result.apiKeyPreview).toMatch(/^sk_\.\.\.[0-9a-f]{4}$/);
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-uuid-1' },
        data: {
          apiKeyHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        },
      });
    });

    it('should throw NotFoundException if tenant does not exist when rotating', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.rotateApiKey('unknown-tenant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
