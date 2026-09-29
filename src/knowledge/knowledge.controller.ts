// src/knowledge/knowledge.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { Tenant } from '@prisma/client';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantGuard } from '../auth/tenant.guard';
import { AddDocumentDto } from './dto/add-document.dto';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
@UseGuards(TenantGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('add')
  async addDocument(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: AddDocumentDto,
  ) {
    return this.knowledgeService.addDocument(tenant, dto);
  }
}