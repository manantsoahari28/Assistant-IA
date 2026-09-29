// src/chat/chat.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: KnowledgeService,
    private readonly configService: ConfigService,
  ) {
    // Initialisation du SDK OpenAI redirigé vers l'API Gemini de Google
    this.openai = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: this.configService.get('GEMINI_API_KEY') || 'dummy-key',
    });
  }

  async handleUserMessage(tenant: Tenant, dto: SendMessageDto) {
    let conversationId = dto.conversationId;

    // 1. Création ou récupération de la conversation
    if (!conversationId) {
      const newConversation = await this.prisma.conversation.create({
        data: { tenantId: tenant.id },
      });
      conversationId = newConversation.id;
    } else {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: tenant.id },
      });
      if (!conversation) {
        throw new NotFoundException('Conversation introuvable');
      }
    }

    // 2. Sauvegarde du message utilisateur dans PostgreSQL
    await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversationId,
        role: 'USER',
        content: dto.message,
      },
    });

    // 3. Récupération de l'historique récent
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // 4. Préparation du prompt avec les consignes de l'entreprise
    const contextChunks = await this.knowledgeService.searchSimilarChunks(tenant.id, dto.message);
    const contextText = contextChunks.length > 0 
    ? `\n\nContexte extrait de la base de connaissances:\n${contextChunks.join('\n---\n')}` 
    : '';

    const systemPrompt = (tenant.botSystemPrompt || 'Tu es un assistant support utile.') + contextText;

    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // 5. Appel à l'API Gemini
    let aiResponseText = '';
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gemini-3.1-flash-lite', // Modèle recommandé par Google Gemini
        messages: formattedMessages,
      });
      aiResponseText =
        response.choices[0]?.message?.content || 'Désolé, aucune réponse générée.';
    } catch (error) {
      console.error('Erreur API Gemini:', error);
      aiResponseText = `Désolé, une erreur technique est survenue.`;
    }

    // 6. Sauvegarde de la réponse de l'IA dans PostgreSQL
    const aiMessage = await this.prisma.message.create({
      data: {
        tenantId: tenant.id,
        conversationId: conversationId,
        role: 'ASSISTANT',
        content: aiResponseText,
      },
    });

    return {
      conversationId,
      reply: aiResponseText,
      messageId: aiMessage.id,
    };
  }
}