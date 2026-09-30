import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Tenant } from '@prisma/client';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantGuard } from '../auth/tenant.guard';
import { AddDocumentDto } from './dto/add-document.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge')
@ApiSecurity('x-api-key')
@Controller('knowledge')
@UseGuards(TenantGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('add')
  @ApiOperation({
    summary: 'Ajouter un document à la base de connaissances',
    description: `Ingère un document texte dans la base de connaissances :
1. Découpe le contenu en **chunks** (~500 caractères)
2. Génère les **embeddings vectoriels** via l'API Gemini
3. Stocke les vecteurs dans **PostgreSQL + pgvector**
4. Le document est immédiatement disponible pour la recherche RAG`,
  })
  @ApiBody({ type: AddDocumentDto })
  @ApiResponse({
    status: 201,
    description: 'Document ingéré et vectorisé avec succès',
    schema: {
      example: {
        message: 'Document ingéré et vectorisé avec succès',
        documentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        chunksCreated: 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  async addDocument(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: AddDocumentDto,
  ) {
    return this.knowledgeService.addDocument(tenant, dto);
  }

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Téléverser et vectoriser un document PDF',
    description: 'Extrait le texte du PDF, le segmente en chunks et stocke les embeddings dans pgvector',
  })
  async uploadPdf(
    @CurrentTenant() tenant: Tenant,
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype?: string;
    },
    @Body('title') title?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier PDF fourni');
    }
    return this.knowledgeService.addPdfDocument(tenant, file.buffer, file.originalname, title);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister tous les documents de la base de connaissances',
    description: 'Retourne la liste des documents avec le nombre de chunks associés, triés par date décroissante.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des documents',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          tenantId: '8169c163-bbf2-452d-81ca-80cf12b3eff2',
          title: 'Politique de Retour et Garantie 2026',
          sourceUrl: null,
          status: 'PROCESSED',
          createdAt: '2026-09-29T12:51:59.417Z',
          _count: { chunks: 3 },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  async findAll(@CurrentTenant() tenant: Tenant) {
    return this.knowledgeService.findAllDocuments(tenant.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un document',
    description: 'Supprime un document et tous ses chunks associés (suppression en cascade). Vérifie que le document appartient bien au tenant.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du document à supprimer',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Document supprimé avec succès',
    schema: {
      example: {
        message: 'Document supprimé avec succès',
        documentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  @ApiResponse({ status: 404, description: 'Document introuvable ou non autorisé' })
  async delete(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.knowledgeService.deleteDocument(tenant.id, id);
  }
}