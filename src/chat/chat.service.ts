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

    // 1. Cycle de vie : Expiration paresseuse (Lazy Evaluation) de RESOLVED vers CLOSED après 24h
    if (conversation.status === ConversationStatus.RESOLVED) {
      const ageMs = Date.now() - new Date(conversation.updatedAt).getTime();
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      if (ageMs > TWENTY_FOUR_HOURS_MS) {
        conversation = await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: ConversationStatus.CLOSED, updatedAt: new Date() },
        });
      }
    }

    // 2. Si la conversation est définitivement fermée (CLOSED), elle est immuable (ADR 0004).
    // Tout nouveau message instancie une nouvelle Conversation liée (parentConversationId).
    if (conversation.status === ConversationStatus.CLOSED) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          userExternalId: conversation.userExternalId,
          category: conversation.category,
          status: ConversationStatus.BOT,
          parentConversationId: conversation.id,
        },
      });
    }

    // 3. Gestion de l'état RESOLVED (dans la période de grâce de 24h)
    // Filtre de politesse hybride (ADR 0006)
    if (conversation.status === ConversationStatus.RESOLVED) {
      const isCourtesy = this.isShortCourtesyMessage(dto.message);
      if (isCourtesy) {
        // Enregistrer le message du client
        await this.prisma.message.create({
          data: {
            tenantId: tenant.id,
            conversationId: conversation.id,
            role: 'USER',
            content: dto.message,
          },
        });

        const softAckReply =
          "Je vous en prie ! Ravi d'avoir pu vous aider. N'hésitez pas si vous avez d'autres questions. Passez une excellente journée !";

        const botMsg = await this.prisma.message.create({
          data: {
            tenantId: tenant.id,
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: softAckReply,
          },
        });

        // La conversation reste RESOLVED avec horodatage rafraîchi
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        return {
          conversationId: conversation.id,
          status: ConversationStatus.RESOLVED,
          reply: softAckReply,
          messageId: botMsg.id,
          handoff: false,
        };
      }

      // Si ce n'est pas une simple formule de politesse, le client pose un nouveau problème : réouverture en BOT
      const reopened = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: ConversationStatus.BOT,
          updatedAt: new Date(),
        },
      });
      if (reopened) {
        conversation = reopened;
      }
    }

    // 4. Sauvegarde du message de l'utilisateur
    await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversation.id,
        role: 'USER',
        content: dto.message,
      },
    });

    // 5. Cas A : L'utilisateur demande explicitement un agent humain (Regex pré-LLM, latence 0ms)
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
          metadata: {
            handoff: true,
            reason: 'USER_REQUEST',
            counselorSummary: `Demande explicite de conseiller par le client : "${dto.message}"`,
          },
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

    // 6. Cas B : RAG avec score de similarité cosinus & Garde-fou déterministe (ADR 0003)
    const scoredChunks = await this.knowledgeService.searchSimilarChunksWithScores(
      tenant.id,
      dto.message,
      3,
    );
    const maxSimilarity =
      scoredChunks.length > 0
        ? Math.max(...scoredChunks.map((c) => c.similarity))
        : 0;

    // Si aucun document pertinent n'est disponible (score < 0.55), escalade immédiate sans hallucination
    if (scoredChunks.length === 0 || maxSimilarity < 0.55) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });

      const safetyNotice =
        "Je ne dispose pas d'informations suffisantes dans ma base de connaissances pour vous répondre avec précision. Je passe votre demande à un conseiller humain qui prendra le relais.";

      const botMessage = await this.prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: safetyNotice,
          metadata: {
            handoff: true,
            reason: 'KNOWLEDGE_GAP',
            counselorSummary: `Absence de document pertinent (score max: ${maxSimilarity.toFixed(2)}). Question client : "${dto.message}"`,
          },
        },
      });

      return {
        conversationId: conversation.id,
        status: ConversationStatus.PENDING_HUMAN,
        reply: safetyNotice,
        messageId: botMessage.id,
        handoff: true,
      };
    }

    // 7. Cas C : Assemblage mémoire Head + Tail (ADR 0004)
    const contextText = `\n\nContexte extrait de la base de connaissances:\n${scoredChunks.map((c) => c.content).join('\n---\n')}`;

    const systemPrompt =
      (tenant.botSystemPrompt || 'Tu es un assistant support client professionnel et courtois.') +
      contextText +
      `\n\nCONSIGNE STRICTE : Si les informations du contexte ne permettent pas de répondre précisément à la demande du client, appelle obligatoirement la fonction escalate_to_counselor.`;

    const allHistory = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        role: { not: 'SYSTEM' },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (allHistory.length <= 12) {
      for (const msg of allHistory) {
        formattedMessages.push({
          role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content,
        });
      }
    } else {
      // Préservation de l'Ancre (Message 1) avec troncature médiane intelligente
      const anchorMsg = allHistory[0];
      const anchorContent = this.formatAnchorContent(anchorMsg.content);
      formattedMessages.push({
        role: (anchorMsg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: anchorContent,
      });

      formattedMessages.push({
        role: 'system',
        content: '[Historique intermédiaire condensé : échanges précédents omis pour concision]',
      });

      const recentTail = allHistory.slice(-10);
      for (const msg of recentTail) {
        formattedMessages.push({
          role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // 8. Outils natifs Gemini (Tool Calling)
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'escalate_to_counselor',
          description:
            "Transférer la conversation à un conseiller humain lorsque l'information est introuvable, incertaine ou requiert une action manuelle.",
          parameters: {
            type: 'object',
            properties: {
              reason: {
                type: 'string',
                enum: [
                  'KNOWLEDGE_GAP',
                  'COMPLEX_INQUIRY',
                  'CUSTOMER_FRUSTRATION',
                  'RESTRICTED_OPERATION',
                ],
                description: 'Raison motivant le transfert vers un conseiller humain.',
              },
              counselorSummary: {
                type: 'string',
                description:
                  'Synthèse concise de 2 phrases de la situation destinée au conseiller support dans son interface de travail.',
              },
              publicCustomerMessage: {
                type: 'string',
                description:
                  "Message courtois et rassurant destiné au client l'informant du transfert vers un conseiller.",
              },
            },
            required: ['reason', 'counselorSummary', 'publicCustomerMessage'],
          },
        },
      },
    ];

    let responseMessage: OpenAI.Chat.Completions.ChatCompletionMessage | null = null;
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gemini-3.1-flash-lite',
        messages: formattedMessages,
        tools,
        tool_choice: 'auto',
      });
      responseMessage = response.choices[0]?.message || null;
    } catch (error) {
      console.error('Erreur API Gemini:', error);
    }

    // Vérifier si le modèle a appelé l'outil d'escalade
    const toolCall = responseMessage?.tool_calls?.find(
      (tc) => tc.type === 'function' && tc.function?.name === 'escalate_to_counselor',
    );

    if (toolCall && toolCall.type === 'function') {
      let reason = 'KNOWLEDGE_GAP';
      let counselorSummary = "Escalade automatique demandée par l'assistant IA.";
      let publicCustomerMessage =
        'Je passe votre demande à un conseiller humain qui prendra le relais sous peu.';

      try {
        const parsedArgs = JSON.parse(toolCall.function.arguments);
        if (parsedArgs.reason) reason = parsedArgs.reason;
        if (parsedArgs.counselorSummary) counselorSummary = parsedArgs.counselorSummary;
        if (parsedArgs.publicCustomerMessage) publicCustomerMessage = parsedArgs.publicCustomerMessage;
      } catch (jsonErr) {
        console.warn('Échec parsing arguments tool_call escalate_to_counselor', jsonErr);
      }

      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });

      const botMessage = await this.prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: publicCustomerMessage,
          metadata: {
            handoff: true,
            reason,
            counselorSummary,
          },
        },
      });

      return {
        conversationId: conversation.id,
        status: ConversationStatus.PENDING_HUMAN,
        reply: publicCustomerMessage,
        messageId: botMessage.id,
        handoff: true,
      };
    }

    // Vérifier si le texte contient l'ancienne balise technique par précaution
    const aiContent = responseMessage?.content || 'Désolé, aucune réponse générée.';
    if (this.detectAiEscalation(aiContent, false)) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });

      const cleanReply = aiContent.replace(/\[ESCALATE_TO_HUMAN\]/gi, '').trim() ||
        'Je transmets votre demande à un conseiller humain.';

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
        content: aiContent,
      },
    });

    return {
      conversationId: conversation.id,
      status: ConversationStatus.BOT,
      reply: aiContent,
      messageId: botMessage.id,
      handoff: false,
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
   * Note : La résolution applique le statut canonique RESOLVED (ADR 0006).
   */
  async resolveConversation(tenant: Tenant, conversationId: string, returnToBot = false) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: tenant.id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    const newStatus = returnToBot ? ConversationStatus.BOT : ConversationStatus.RESOLVED;

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: newStatus },
    });

    const infoNotice = returnToBot
      ? "La conversation a été retransférée à l'assistant virtuel (BOT)."
      : 'La conversation a été marquée comme résolue (RESOLVED) par le conseiller. Période de grâce de 24h activée.';

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
   * Détecte si le message est une formule de politesse courte de clôture (ADR 0006)
   */
  private isShortCourtesyMessage(message: string): boolean {
    const clean = message.trim().toLowerCase();
    if (clean.length > 70) return false;

    const courtesyPatterns = [
      /^(merci(\s+(beaucoup|infiniment|bien))?(\s+(pour|d['’])\s+(tout|votre\s+aide|votre\s+retour|votre\s+réactivité|l['’]aide))?|merci\s+[àa]\s+(vous|toi)|re-merci|super|parfait|nickel|top|impeccable|genial|génial)[. !]*$/i,
      /^(bonne\s+journée|bonne\s+soiree|bonne\s+soirée|bon\s+weekend|bon\s+week-end|au\s+revoir|a\s+bientot|à\s+bientôt)[. !]*$/i,
      /^(c['’]est\s+(bon|parfait|noté|regle|réglé|tout\s+bon)|tout\s+est\s+(bon|ok|clair|parfait))[. !]*$/i,
      /^(thanks|thank\s+you(\s+(very\s+much|for\s+your\s+help|for\s+everything))?|great|perfect|awesome|bye|have\s+a\s+(good|great|nice)\s+day)[. !]*$/i,
    ];

    return courtesyPatterns.some((pattern) => pattern.test(clean));
  }

  /**
   * Troncature médiane intelligente pour l'Ancre (Message 1) si supérieure à maxChars (ADR 0004)
   */
  private formatAnchorContent(content: string, maxChars = 3200): string {
    if (content.length <= maxChars) return content;
    const headPart = content.slice(0, 1600);
    const tailPart = content.slice(-800);
    return `${headPart}\n\n[... Demande initiale tronquée pour concision ...]\n\n${tailPart}`;
  }

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

    return notFoundPatterns.some((pattern) => pattern.test(normalized));
  }

  /**
   * Tableau de bord des statistiques et demandes les plus fréquentes (Sujet 4)
   */
  async getAnalytics(tenant: Tenant) {
    const [
      totalConversations,
      statusCounts,
      categoryCounts,
      totalMessages,
      tokenStats,
      totalDocuments,
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: { tenantId: tenant.id },
      }),
      this.prisma.conversation.groupBy({
        by: ['status'],
        where: { tenantId: tenant.id },
        _count: { id: true },
      }),
      this.prisma.conversation.groupBy({
        by: ['category'],
        where: { tenantId: tenant.id },
        _count: { id: true },
      }),
      this.prisma.message.count({
        where: { tenantId: tenant.id },
      }),
      this.prisma.message.aggregate({
        where: { tenantId: tenant.id },
        _sum: { tokensUsed: true },
      }),
      this.prisma.knowledgeBaseDocument.count({
        where: { tenantId: tenant.id },
      }),
    ]);

    const categories: Record<string, number> = {
      BUG: 0,
      QUESTION: 0,
      RECLAMATION: 0,
      UNCLASSIFIED: 0,
    };
    categoryCounts.forEach((c: { category: string | null; _count: { id: number } }) => {
      if (c.category) {
        categories[c.category] = c._count.id;
      } else {
        categories.UNCLASSIFIED += c._count.id;
      }
    });

    const statuses: Record<ConversationStatus, number> = {
      BOT: 0,
      PENDING_HUMAN: 0,
      HUMAN_ACTIVE: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    statusCounts.forEach((s: { status: ConversationStatus; _count: { id: number } }) => {
      statuses[s.status] = s._count.id;
    });

    return {
      totalConversations,
      totalMessages,
      totalDocuments,
      totalTokensUsed: tokenStats._sum.tokensUsed || 0,
      statuses,
      categories,
    };
  }
}