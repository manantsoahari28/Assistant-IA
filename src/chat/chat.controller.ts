// src/chat/chat.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Tenant } from '@prisma/client';
import { ConversationStatus } from '@prisma/client';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantGuard } from '../auth/tenant.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AgentMessageDto } from './dto/agent-message.dto';

@ApiTags('chat')
@ApiSecurity('x-api-key')
@Controller('chat')
@UseGuards(TenantGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({
    summary: 'Envoyer un message utilisateur',
    description: `Traite le message selon l'état de la conversation :
- **BOT** : L'IA répond automatiquement via RAG + Gemini.
- **PENDING_HUMAN** : Le message est enregistré, l'IA ne répond plus.
- **HUMAN_ACTIVE** : Le message est transmis au conseiller, le bot est désactivé.

Si l'utilisateur demande un humain (explicitement ou via \`requestHuman: true\`), la conversation passe en **PENDING_HUMAN**.
Si l'IA ne trouve pas la réponse dans la base de connaissances, elle déclenche automatiquement le transfert.`,
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Message traité avec succès' })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async sendMessage(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.handleUserMessage(tenant, dto);
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Lister les conversations',
    description: 'Récupère toutes les conversations du tenant, filtrables par statut.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ConversationStatus,
    description: 'Filtrer par statut (BOT, PENDING_HUMAN, HUMAN_ACTIVE, CLOSED)',
    example: ConversationStatus.PENDING_HUMAN,
  })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  async getConversations(
    @CurrentTenant() tenant: Tenant,
    @Query('status') status?: ConversationStatus,
  ) {
    return this.chatService.getConversations(tenant, status);
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Conversations en attente d\'un agent humain',
    description: 'Raccourci pour l\'équipe support : liste toutes les conversations en statut **PENDING_HUMAN**.',
  })
  @ApiResponse({ status: 200, description: 'Liste des conversations en attente' })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  async getPendingConversations(@CurrentTenant() tenant: Tenant) {
    return this.chatService.getConversations(tenant, ConversationStatus.PENDING_HUMAN);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Tableau de bord et statistiques des demandes fréquentes (Sujet 4)',
    description: 'Retourne les métriques globales : répartition par statut, volume par catégorie (BUG, QUESTION, RECLAMATION), messages et tokens.',
  })
  @ApiResponse({ status: 200, description: 'Statistiques du tableau de bord' })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  async getAnalytics(@CurrentTenant() tenant: Tenant) {
    return this.chatService.getAnalytics(tenant);
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Historique complet d\'une conversation',
    description: 'Récupère le statut et tous les messages d\'une conversation spécifique.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Conversation avec historique des messages' })
  @ApiResponse({ status: 401, description: 'Clé API manquante ou invalide' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async getConversation(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.chatService.getConversationById(tenant, id);
  }

  @Post('conversations/:id/take-over')
  @ApiOperation({
    summary: 'Prise en main par un conseiller humain',
    description: 'Passe la conversation en **HUMAN_ACTIVE** : le bot est désactivé, le conseiller prend le contrôle.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agentName: { type: 'string', example: 'Sarah du Support', description: 'Nom du conseiller (optionnel)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Conversation passée en HUMAN_ACTIVE' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async takeOver(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body('agentName') agentName?: string,
  ) {
    return this.chatService.takeOverConversation(tenant, id, agentName);
  }

  @Post('conversations/:id/agent-message')
  @ApiOperation({
    summary: 'Envoyer un message en tant que conseiller humain',
    description: 'Enregistre un message de l\'agent humain dans l\'historique de la conversation.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: AgentMessageDto })
  @ApiResponse({ status: 201, description: 'Message de l\'agent enregistré' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async sendAgentMessage(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: AgentMessageDto,
  ) {
    return this.chatService.sendAgentMessage(tenant, id, dto);
  }

  @Post('conversations/:id/resolve')
  @ApiOperation({
    summary: 'Clôturer ou retransférer la conversation au bot',
    description: `Permet au conseiller de terminer la prise en charge :
- \`returnToBot: true\` → Repasse en **BOT** (l'IA répond à nouveau)
- \`returnToBot: false\` (défaut) → Passe en **CLOSED** (conversation terminée)`,
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        returnToBot: { type: 'boolean', example: false, description: 'true = repasse au BOT, false = CLOSED' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Conversation clôturée ou retransférée au bot' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async resolveConversation(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body('returnToBot') returnToBot?: boolean,
  ) {
    return this.chatService.resolveConversation(tenant, id, returnToBot);
  }

  @Post('conversations/:id/escalate')
  @ApiOperation({
    summary: 'Escalader manuellement vers un agent humain',
    description: 'Force le passage de la conversation en **PENDING_HUMAN** (escalade manuelle côté admin/bot).',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 201, description: 'Conversation passée en PENDING_HUMAN' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async escalateConversation(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
  ) {
    return this.chatService.escalateConversation(tenant, id);
  }
}