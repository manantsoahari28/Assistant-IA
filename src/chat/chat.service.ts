// src/chat/chat.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationStatus, Tenant } from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AgentMessageDto } from './dto/agent-message.dto';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: KnowledgeService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: this.configService.get('GEMINI_API_KEY') || 'dummy-key',
    });
  }

  /**
   * Traitement du message utilisateur selon les 3 états :
   * 1. BOT : L'IA répond automatiquement (RAG + Gemini).
   * 2. PENDING_HUMAN : La conversation attend un agent ; le bot n'appelle plus l'IA.
   * 3. HUMAN_ACTIVE : Un conseiller humain a pris la main ; le bot est totalement désactivé.
   */
  async handleUserMessage(tenant: Tenant, dto: SendMessageDto) {
    let conversationId = dto.conversationId;
    let conversation;

    // 1. Récupération ou création de la conversation (statut initial : BOT)
    if (!conversationId) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          status: ConversationStatus.BOT,
        },
      });
      conversationId = conversation.id;
    } else {
      conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: tenant.id },
      });
      if (!conversation) {
        throw new NotFoundException('Conversation introuvable');
      }
    }

    // =========================================================================
    // ÉTAT 3 : HUMAN_ACTIVE (Un conseiller humain a pris la main)
    // Le bot se désactive totalement sur cette discussion.
    // =========================================================================
    if (conversation.status === ConversationStatus.HUMAN_ACTIVE) {
      const userMessage = await this.prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversation.id,
          role: 'USER',
          content: dto.message,
        },
      });

      return {
        conversationId: conversation.id,
        status: ConversationStatus.HUMAN_ACTIVE,
        reply: null,
        message: 'Message transmis à votre conseiller.',
        messageId: userMessage.id,
      };
    }

    // =========================================================================
    // ÉTAT 2 : PENDING_HUMAN (En attente de prise en charge par un agent)
    // L'utilisateur a déjà demandé un humain ou l'IA n'a pas su répondre.
    // =========================================================================
    if (conversation.status === ConversationStatus.PENDING_HUMAN) {
      const userMessage = await this.prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversation.id,
          role: 'USER',
          content: dto.message,
        },
      });

      return {
        conversationId: conversation.id,
        status: ConversationStatus.PENDING_HUMAN,
        reply: "Votre demande est actuellement en attente d'un conseiller humain. Votre message a bien été enregistré et un agent vous répondra dès que possible.",
        messageId: userMessage.id,
        handoff: true,
      };
    }

    // =========================================================================
    // ÉTAT 1 : BOT (L'IA répond automatiquement)
    // =========================================================================

    // Sauvegarde du message de l'utilisateur
    await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversation.id,
        role: 'USER',
        content: dto.message,
      },
    });

    // Cas A : L'utilisateur demande explicitement un agent humain
    const userWantsHuman = dto.requestHuman || this.detectHumanRequest(dto.message);
    if (userWantsHuman) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });

      const escalationReply =
        'Je transmets votre demande à un conseiller humain. Un agent va prendre en charge votre discussion très prochainement.';

      const botMessage = await this.prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: escalationReply,
          metadata: { handoff: true, reason: 'USER_REQUEST' },
        },
      });

      return {
        conversationId: conversation.id,
        status: ConversationStatus.PENDING_HUMAN,
        reply: escalationReply,
        messageId: botMessage.id,
        handoff: true,
      };
    }

    // Cas B : Traitement classique via RAG et Gemini
    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const contextChunks = await this.knowledgeService.searchSimilarChunks(tenant.id, dto.message);
    const contextText =
      contextChunks.length > 0
        ? `\n\nContexte extrait de la base de connaissances:\n${contextChunks.join('\n---\n')}`
        : '';

    // Directive d'escalade : si l'IA ne sait pas, elle émet la balise [ESCALATE_TO_HUMAN]
    const escalationInstruction =
      `\n\nCONSIGNE STRICTE : Base tes réponses uniquement sur les informations vérifiées issues du contexte fourni ci-dessus. Si le contexte ne te permet pas de répondre précisément à la demande du client, ou si tu ne trouves pas l'information, réponds poliment que tu ne disposes pas de ces données et termine obligatoirement avec la balise [ESCALATE_TO_HUMAN] pour déclencher le transfert vers un agent humain.`;

    const systemPrompt =
      (tenant.botSystemPrompt || 'Tu es un assistant support client professionnel et courtois.') +
      contextText +
      escalationInstruction;

    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    let aiResponseText = '';
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gemini-3.1-flash-lite',
        messages: formattedMessages,
      });
      aiResponseText =
        response.choices[0]?.message?.content || 'Désolé, aucune réponse générée.';
    } catch (error) {
      console.error('Erreur API Gemini:', error);
      aiResponseText = 'Désolé, une erreur technique est survenue.';
    }

    // Cas C : L'IA n'a pas trouvé la réponse ou a déclenché l'escalade
    const aiEscalated = this.detectAiEscalation(aiResponseText, contextChunks.length === 0);

    if (aiEscalated) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });

      // Nettoyer la balise technique avant restitution au client
      let cleanReply = aiResponseText.replace(/\[ESCALATE_TO_HUMAN\]/gi, '').trim();
      if (!cleanReply || cleanReply.length < 5) {
        cleanReply =
          "Je n'ai pas trouvé la réponse dans ma base de connaissances. Je transmets votre conversation à un conseiller humain.";
      } else if (
        !cleanReply.toLowerCase().includes('humain') &&
        !cleanReply.toLowerCase().includes('conseiller') &&
        !cleanReply.toLowerCase().includes('agent')
      ) {
        cleanReply +=
          "\n\nJe passe votre demande en attente d'un conseiller humain qui prendra le relais sous peu.";
      }

      const botMessage = await this.prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: cleanReply,
          metadata: { handoff: true, reason: 'AI_UNKNOWN' },
        },
      });

      return {
        conversationId: conversation.id,
        status: ConversationStatus.PENDING_HUMAN,
        reply: cleanReply,
        messageId: botMessage.id,
        handoff: true,
      };
    }

    // Cas D : L'IA a répondu avec succès, le bot reste actif (BOT)
    const botMessage = await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResponseText,
      },
    });

    return {
      conversationId: conversation.id,
      status: ConversationStatus.BOT,
      reply: aiResponseText,
      messageId: botMessage.id,
    };
  }

  // =========================================================================
  // GESTION AGENT HUMAIN (Conseiller Support)
  // =========================================================================

  /**
   * Récupérer les conversations d'un tenant (filtrables par statut, ex: PENDING_HUMAN)
   */
  async getConversations(tenant: Tenant, status?: ConversationStatus) {
    return this.prisma.conversation.findMany({
      where: {
        tenantId: tenant.id,
        ...(status ? { status } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Dernier message pour aperçu
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Récupérer une conversation avec son historique complet
   */
  async getConversationById(tenant: Tenant, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    return conversation;
  }

  /**
   * Prise en main par un agent humain :
   * Passe le statut de PENDING_HUMAN (ou BOT) à HUMAN_ACTIVE.
   */
  async takeOverConversation(tenant: Tenant, conversationId: string, agentName?: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.HUMAN_ACTIVE },
    });

    const systemNotice = agentName
      ? `${agentName} a pris en charge la conversation.`
      : 'Un conseiller humain a pris en charge la conversation.';

    await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversation.id,
        role: 'SYSTEM',
        content: systemNotice,
        metadata: { isAgentTakeover: true, agentName },
      },
    });

    return {
      conversationId: updated.id,
      status: updated.status,
      message: systemNotice,
    };
  }

  /**
   * Envoi d'une réponse par un agent humain :
   * Enregistre le message et garantit que la discussion reste en HUMAN_ACTIVE.
   */
  async sendAgentMessage(tenant: Tenant, conversationId: string, dto: AgentMessageDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    // Assurer l'état HUMAN_ACTIVE
    if (conversation.status !== ConversationStatus.HUMAN_ACTIVE) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: ConversationStatus.HUMAN_ACTIVE },
      });
    }

    const agentMessage = await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: dto.message,
        metadata: {
          isHumanAgent: true,
          agentName: dto.agentName || 'Conseiller Support',
        },
      },
    });

    return {
      conversationId: conversation.id,
      status: ConversationStatus.HUMAN_ACTIVE,
      messageId: agentMessage.id,
      content: agentMessage.content,
      agentName: dto.agentName || 'Conseiller Support',
    };
  }

  /**
   * Résoudre ou repasser la conversation au BOT
   */
  async resolveConversation(tenant: Tenant, conversationId: string, returnToBot = false) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    const newStatus = returnToBot ? ConversationStatus.BOT : ConversationStatus.CLOSED;

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: newStatus },
    });

    const infoNotice = returnToBot
      ? "La conversation a été retransférée à l'assistant virtuel (BOT)."
      : 'La conversation a été clôturée par le conseiller.';

    await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversation.id,
        role: 'SYSTEM',
        content: infoNotice,
      },
    });

    return {
      conversationId: updated.id,
      status: updated.status,
      message: infoNotice,
    };
  }

  /**
   * Forcer l'escalade manuelle vers PENDING_HUMAN
   */
  async escalateConversation(tenant: Tenant, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.PENDING_HUMAN },
    });

    return {
      conversationId: updated.id,
      status: updated.status,
      message: "Conversation passée en attente d'un conseiller humain (PENDING_HUMAN).",
    };
  }

  // =========================================================================
  // DÉTECTIONS ET HEURISTIQUES
  // =========================================================================

  /**
   * Détecte si le message de l'utilisateur exprime l'envie de parler à un humain
   */
  private detectHumanRequest(message: string): boolean {
    const normalized = message.toLowerCase().trim();

    const patterns = [
      /\b(parler|passer|discuter|échanger|transferer|transférer|joindre|connecter)\s+(à|a|avec)?\s*(un|une)?\s*(humain|conseiller|agent|opérateur|personne|commercial|responsable)/i,
      /\b(agent|conseiller|opérateur|humain)\s+(humain|réel|physique)/i,
      /\b(je\s+veux|j'aimerais|je\s+souhaite|pouvez-vous|peux-tu|besoin\s+d['’])\s+(parler\s+[àa]|un|une)?\s*(humain|agent|conseiller|opérateur)/i,
      /\b(service\s+client|support\s+humain|vrai\s+personne|vraie\s+personne)/i,
      /\b(talk|speak)\s+to\s+(a\s+)?(human|agent|representative|person|operator)/i,
      /\b(human\s+agent|human\s+handoff|human\s+support)/i,
      /\b(un\s+humain|agent\s+humain|vrai\s+humain)/i,
    ];

    return patterns.some((regex) => regex.test(normalized));
  }

  /**
   * Détecte si l'IA n'a pas su répondre ou demande le relais humain
   */
  private detectAiEscalation(aiReply: string, _hasNoContext: boolean): boolean {
    if (/\[ESCALATE_TO_HUMAN\]/i.test(aiReply)) {
      return true;
    }

    const normalized = aiReply.toLowerCase();
    const notFoundPatterns = [
      /je ne (dispose pas|trouve pas|possède pas|connais pas|suis pas en mesure)/i,
      /aucune information/i,
      /pas d['’]information/i,
      /hors de ma base de connaissances/i,
      /transférer.*(conseiller|agent|humain)/i,
    ];

    // Si aucun contexte RAG et l'IA exprime son impossibilité de répondre
    return notFoundPatterns.some((pattern) => pattern.test(normalized));
  }
}