// src/tenant/tenant.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère les paramètres du tenant (id, name, apiKey, botSystemPrompt, createdAt)
   */
  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        apiKeyHash: true,
        botSystemPrompt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Entreprise (Tenant) introuvable');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      apiKey: tenant.apiKeyHash,
      botSystemPrompt: tenant.botSystemPrompt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  /**
   * Met à jour le nom et/ou le prompt système du bot pour ce tenant
   */
  async updateSettings(tenantId: string, dto: UpdateTenantDto) {
    // Vérifier l'existence préalable du tenant
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException('Entreprise (Tenant) introuvable');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.botSystemPrompt !== undefined ? { botSystemPrompt: dto.botSystemPrompt } : {}),
      },
      select: {
        id: true,
        name: true,
        apiKeyHash: true,
        botSystemPrompt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Paramètres mis à jour avec succès',
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        apiKey: updatedTenant.apiKeyHash,
        botSystemPrompt: updatedTenant.botSystemPrompt,
        createdAt: updatedTenant.createdAt,
        updatedAt: updatedTenant.updatedAt,
      },
    };
  }
}
