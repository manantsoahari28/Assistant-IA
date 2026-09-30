// src/tenant/tenant.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Tenant } from '@prisma/client';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantGuard } from '../auth/tenant.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';

@ApiTags('tenant')
@ApiSecurity('x-api-key')
@Controller('tenant')
@UseGuards(TenantGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('settings')
  @ApiOperation({
    summary: 'Récupérer les paramètres du tenant',
    description: 'Retourne la configuration de l\'entreprise : nom, clé API, prompt système du bot, dates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres du tenant',
    schema: {
      example: {
        id: '8169c163-bbf2-452d-81ca-80cf12b3eff2',
        name: 'Entreprise De Démo',
        apiKey: 'cle-api-test-123',
        botSystemPrompt: 'Tu es un assistant de support client professionnel, courtois et concis.',
        createdAt: '2026-09-29T07:14:19.195Z',
        updatedAt: '2026-09-29T07:14:19.195Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  async getSettings(@CurrentTenant() tenant: Tenant) {
    return this.tenantService.getSettings(tenant.id);
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Mettre à jour les paramètres du tenant',
    description: 'Modifie le nom de l\'entreprise et/ou le prompt système du bot IA. Seuls les champs fournis sont mis à jour (PATCH partiel).',
  })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({
    status: 200,
    description: 'Paramètres mis à jour avec succès',
    schema: {
      example: {
        message: 'Paramètres mis à jour avec succès',
        tenant: {
          id: '8169c163-bbf2-452d-81ca-80cf12b3eff2',
          name: 'Mon Entreprise Pro',
          apiKey: 'cle-api-test-123',
          botSystemPrompt: 'Tu es un assistant IA expert en support technique.',
          createdAt: '2026-09-29T07:14:19.195Z',
          updatedAt: '2026-09-29T18:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  @ApiResponse({ status: 404, description: 'Tenant introuvable' })
  async updateSettings(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.updateSettings(tenant.id, dto);
  }

  @Post('rotate-api-key')
  @ApiOperation({
    summary: 'Régénérer une nouvelle clé API pour le tenant',
    description: 'Invalide la clé précédente, génère une nouvelle clé aléatoire cryptographiquement sûre, et la retourne en clair une seule et unique fois.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nouvelle clé API générée avec succès',
    schema: {
      example: {
        message: 'Clé API régénérée avec succès. Conservez-la en lieu sûr, elle ne sera plus jamais réaffichée.',
        apiKey: 'sk_live_9f81a7b8c2d1e0f...',
        apiKeyPreview: 'sk_...0f1a',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  @ApiResponse({ status: 404, description: 'Tenant introuvable' })
  async rotateApiKey(@CurrentTenant() tenant: Tenant) {
    return this.tenantService.rotateApiKey(tenant.id);
  }
}
