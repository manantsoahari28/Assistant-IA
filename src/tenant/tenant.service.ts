// src/tenant/tenant.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper pour masquer la clé API (affiche uniquement les 4 derniers caractères)
   */
  private formatApiKeyPreview(apiKeyHash: string | null): string | null {
    if (!apiKeyHash) return null;
    return `sk_...${apiKeyHash.slice(-4)}`;
  }

  /**
   * Récupère les paramètres du tenant (id, name, apiKeyPreview, botSystemPrompt, createdAt)
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
      apiKeyPreview: this.formatApiKeyPreview(tenant.apiKeyHash),
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
        apiKeyPreview: this.formatApiKeyPreview(updatedTenant.apiKeyHash),
        botSystemPrompt: updatedTenant.botSystemPrompt,
        createdAt: updatedTenant.createdAt,
        updatedAt: updatedTenant.updatedAt,
      },
    };
  }

  /**
   * Régénère une clé API aléatoire cryptographique pour le tenant (ADR 0007 / Sécurité)
   */
  async rotateApiKey(tenantId: string) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException('Entreprise (Tenant) introuvable');
    }

    const newPlainKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const newHash = crypto.createHash('sha256').update(newPlainKey).digest('hex');

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { apiKeyHash: newHash },
    });

    return {
      message: 'Clé API régénérée avec succès. Conservez-la en lieu sûr, elle ne sera plus jamais réaffichée.',
      apiKey: newPlainKey,
      apiKeyPreview: this.formatApiKeyPreview(newHash),
    };
  }
}
