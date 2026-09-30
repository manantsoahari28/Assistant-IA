import { Test, TestingModule } from '@nestjs/testing';
import { Tenant } from '@prisma/client';
import { TenantGuard } from '../auth/tenant.guard';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController', () => {
  let controller: TenantController;
  let tenantService: {
    getSettings: jest.Mock;
    updateSettings: jest.Mock;
    rotateApiKey: jest.Mock;
  };

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Entreprise Test',
    apiKeyHash: 'hash-abc-123',
    botSystemPrompt: 'Tu es poli.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    tenantService = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      rotateApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        { provide: TenantService, useValue: tenantService },
      ],
    })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TenantController>(TenantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should delegate to tenantService.getSettings with current tenant id', async () => {
      tenantService.getSettings.mockResolvedValue({
        id: mockTenant.id,
        name: mockTenant.name,
        apiKeyPreview: 'sk_...c123',
      });

      const result = await controller.getSettings(mockTenant);

      expect(tenantService.getSettings).toHaveBeenCalledWith(mockTenant.id);
      expect(result.apiKeyPreview).toBe('sk_...c123');
    });
  });

  describe('rotateApiKey', () => {
    it('should delegate to tenantService.rotateApiKey and return new credentials', async () => {
      const mockRotation = {
        message: 'Clé API régénérée avec succès.',
        apiKey: 'sk_live_1234567890abcdef',
        apiKeyPreview: 'sk_...cdef',
      };
      tenantService.rotateApiKey.mockResolvedValue(mockRotation);

      const result = await controller.rotateApiKey(mockTenant);

      expect(tenantService.rotateApiKey).toHaveBeenCalledWith(mockTenant.id);
      expect(result).toEqual(mockRotation);
    });
  });
});
