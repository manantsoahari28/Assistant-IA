import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus, Tenant } from '@prisma/client';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { AgentMessageDto } from './dto/agent-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    conversation: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    message: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let knowledgeService: {
    searchSimilarChunks: jest.Mock;
    searchSimilarChunksWithScores: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    apiKeyHash: 'hash-123',
    botSystemPrompt: 'Tu es un bot test.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    knowledgeService = {
      searchSimilarChunks: jest.fn().mockResolvedValue(['Contexte pertinent']),
      searchSimilarChunksWithScores: jest.fn().mockResolvedValue([
        { content: 'Contexte pertinent', similarity: 0.95 },
      ]),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-gemini-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: KnowledgeService, useValue: knowledgeService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleUserMessage', () => {
    it('should create a new conversation in BOT status if no conversationId is provided', async () => {
      const dto: SendMessageDto = {
        message: 'Bonjour',
      };

      prisma.conversation.create.mockResolvedValue({
        id: 'conv-new',
        tenantId: mockTenant.id,
        status: ConversationStatus.BOT,
      });

      prisma.message.create.mockResolvedValue({
        id: 'msg-user-1',
        conversationId: 'conv-new',
      });

      prisma.message.findMany.mockResolvedValue([]);

      const mockOpenAi = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Bonjour ! En quoi puis-je vous aider ?' } }],
            }),
          },
        },
      };
      (service as any).openai = mockOpenAi;

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenant.id,
          status: ConversationStatus.BOT,
        },
      });
      expect(result.status).toBe(ConversationStatus.BOT);
      expect(result.reply).toBe('Bonjour ! En quoi puis-je vous aider ?');
    });

    it('should handle PENDING_HUMAN conversation by recording user message and returning waiting reply', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-pending',
        message: 'Avez-vous du nouveau ?',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-pending',
        tenantId: mockTenant.id,
        status: ConversationStatus.PENDING_HUMAN,
      });

      prisma.message.create.mockResolvedValue({
        id: 'msg-recorded',
      });

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenant.id,
          conversationId: 'conv-pending',
          role: 'USER',
          content: 'Avez-vous du nouveau ?',
        },
      });
      expect(result.status).toBe(ConversationStatus.PENDING_HUMAN);
      expect(result.handoff).toBe(true);
      expect(result.reply).toContain("en attente d'un conseiller humain");
    });

    it('should immediately escalate to PENDING_HUMAN if user requests a human explicitly', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-1',
        message: 'Je souhaite parler à un conseiller humain s’il vous plaît',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        tenantId: mockTenant.id,
        status: ConversationStatus.BOT,
      });

      prisma.message.create.mockResolvedValue({
        id: 'msg-human-request',
      });

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });
      expect(result.status).toBe(ConversationStatus.PENDING_HUMAN);
      expect(result.handoff).toBe(true);
      expect(result.reply).toContain('Je transmets votre demande à un conseiller humain');
    });

    it('should fork a new conversation linked to parent when a CLOSED conversation receives a message', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-closed',
        message: 'Nouvelle demande après clôture',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-closed',
        tenantId: mockTenant.id,
        status: ConversationStatus.CLOSED,
        userExternalId: 'ext-user-1',
        category: null,
      });

      const forkedConversation = {
        id: 'conv-forked-new',
        tenantId: mockTenant.id,
        status: ConversationStatus.BOT,
        parentConversationId: 'conv-closed',
      };

      prisma.conversation.create.mockResolvedValue(forkedConversation);
      prisma.message.create.mockResolvedValue({ id: 'msg-1' });
      prisma.message.findMany.mockResolvedValue([]);

      const mockOpenAi = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Rebonjour ! Je suis là pour vous aider.' } }],
            }),
          },
        },
      };
      (service as any).openai = mockOpenAi;

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenant.id,
          userExternalId: 'ext-user-1',
          category: null,
          status: ConversationStatus.BOT,
          parentConversationId: 'conv-closed',
        },
      });
      expect(result.conversationId).toBe('conv-forked-new');
      expect(result.status).toBe(ConversationStatus.BOT);
      expect(result.reply).toBe('Rebonjour ! Je suis là pour vous aider.');
    });

    it('should filter courtesy thank-you on RESOLVED conversations without reopening or escalating', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-resolved',
        message: 'Merci beaucoup pour votre aide !',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-resolved',
        tenantId: mockTenant.id,
        status: ConversationStatus.RESOLVED,
        updatedAt: new Date(), // Récent (< 24h)
      });

      prisma.conversation.update.mockResolvedValue({
        id: 'conv-resolved',
        tenantId: mockTenant.id,
        status: ConversationStatus.RESOLVED,
      });

      prisma.message.create.mockResolvedValue({ id: 'msg-ack' });

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(result.status).toBe(ConversationStatus.RESOLVED);
      expect(result.handoff).toBe(false);
      expect(result.reply).toContain('Je vous en prie');
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-resolved' },
        data: expect.objectContaining({ updatedAt: expect.any(Date) }),
      });
    });

    it('should reopen RESOLVED conversation to BOT if the customer brings up a new inquiry', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-resolved',
        message: 'En fait j ai un autre problème avec mon colis abîmé',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-resolved',
        tenantId: mockTenant.id,
        status: ConversationStatus.RESOLVED,
        updatedAt: new Date(),
      });

      prisma.conversation.update.mockResolvedValue({
        id: 'conv-resolved',
        tenantId: mockTenant.id,
        status: ConversationStatus.BOT,
      });

      prisma.message.create.mockResolvedValue({ id: 'msg-new-issue' });
      prisma.message.findMany.mockResolvedValue([]);

      const mockOpenAi = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Je peux vous aider pour ce colis.' } }],
            }),
          },
        },
      };
      (service as any).openai = mockOpenAi;

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-resolved' },
        data: {
          status: ConversationStatus.BOT,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(ConversationStatus.BOT);
      expect(result.reply).toBe('Je peux vous aider pour ce colis.');
    });

    it('should trigger deterministic cosine safety net when chunks similarity is below 0.55', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-1',
        message: 'Question introuvable dans la base',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        tenantId: mockTenant.id,
        status: ConversationStatus.BOT,
      });

      prisma.message.create.mockResolvedValue({ id: 'msg-1' });

      // Simuler aucun chunk ou score faible
      knowledgeService.searchSimilarChunksWithScores.mockResolvedValue([
        { content: 'Hors sujet', similarity: 0.32 },
      ]);

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              handoff: true,
              reason: 'KNOWLEDGE_GAP',
            }),
          }),
        }),
      );
      expect(result.status).toBe(ConversationStatus.PENDING_HUMAN);
      expect(result.handoff).toBe(true);
    });

    it('should execute native tool calling escalate_to_counselor when triggered by Gemini', async () => {
      const dto: SendMessageDto = {
        conversationId: 'conv-1',
        message: 'Mon paiement a échoué 3 fois',
      };

      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        tenantId: mockTenant.id,
        status: ConversationStatus.BOT,
      });

      prisma.message.create.mockResolvedValue({ id: 'msg-1' });
      prisma.message.findMany.mockResolvedValue([]);

      const mockOpenAi = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: null,
                    tool_calls: [
                      {
                        id: 'call_123',
                        type: 'function',
                        function: {
                          name: 'escalate_to_counselor',
                          arguments: JSON.stringify({
                            reason: 'RESTRICTED_OPERATION',
                            counselorSummary: 'Échec répété de paiement CB, intervention manuelle requise.',
                            publicCustomerMessage: 'Un conseiller financier prend le relais pour sécuriser votre transaction.',
                          }),
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          },
        },
      };
      (service as any).openai = mockOpenAi;

      const result = await service.handleUserMessage(mockTenant, dto);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Un conseiller financier prend le relais pour sécuriser votre transaction.',
            metadata: expect.objectContaining({
              handoff: true,
              reason: 'RESTRICTED_OPERATION',
              counselorSummary: 'Échec répété de paiement CB, intervention manuelle requise.',
            }),
          }),
        }),
      );
      expect(result.status).toBe(ConversationStatus.PENDING_HUMAN);
      expect(result.reply).toBe('Un conseiller financier prend le relais pour sécuriser votre transaction.');
    });

    it('should throw NotFoundException if conversation is not found', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.handleUserMessage(mockTenant, { conversationId: 'conv-missing', message: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getConversations', () => {
    it('should return conversations with last message', async () => {
      const mockList = [{ id: 'conv-1', messages: [{ content: 'Dernier message' }] }];
      prisma.conversation.findMany.mockResolvedValue(mockList);

      const result = await service.getConversations(mockTenant, ConversationStatus.PENDING_HUMAN);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenant.id, status: ConversationStatus.PENDING_HUMAN },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockList);
    });
  });

  describe('getConversationById', () => {
    it('should return conversation with all messages when found', async () => {
      const mockConv = { id: 'conv-1', messages: [] };
      prisma.conversation.findFirst.mockResolvedValue(mockConv);

      const result = await service.getConversationById(mockTenant, 'conv-1');

      expect(result).toEqual(mockConv);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);

      await expect(service.getConversationById(mockTenant, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('takeOverConversation', () => {
    it('should transition status to HUMAN_ACTIVE and add SYSTEM message', async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', tenantId: mockTenant.id });
      prisma.conversation.update.mockResolvedValue({ id: 'conv-1', status: ConversationStatus.HUMAN_ACTIVE });
      prisma.message.create.mockResolvedValue({ id: 'sys-msg-1' });

      const result = await service.takeOverConversation(mockTenant, 'conv-1', 'Alex');

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.HUMAN_ACTIVE },
      });
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'SYSTEM',
          content: 'Alex a pris en charge la conversation.',
        }),
      });
      expect(result.status).toBe(ConversationStatus.HUMAN_ACTIVE);
    });
  });

  describe('sendAgentMessage', () => {
    it('should create an ASSISTANT message with agentName metadata', async () => {
      const dto: AgentMessageDto = { message: 'Voici votre facture.', agentName: 'Alex' };
      prisma.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        tenantId: mockTenant.id,
        status: ConversationStatus.HUMAN_ACTIVE,
      });
      prisma.message.create.mockResolvedValue({
        id: 'msg-agent',
        content: dto.message,
      });

      const result = await service.sendAgentMessage(mockTenant, 'conv-1', dto);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'ASSISTANT',
          content: dto.message,
          metadata: expect.objectContaining({ isHumanAgent: true, agentName: 'Alex' }),
        }),
      });
      expect(result.status).toBe(ConversationStatus.HUMAN_ACTIVE);
    });
  });

  describe('resolveConversation', () => {
    it('should set status to RESOLVED when returnToBot is false', async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', tenantId: mockTenant.id });
      prisma.conversation.update.mockResolvedValue({ id: 'conv-1', status: ConversationStatus.RESOLVED });
      prisma.message.create.mockResolvedValue({ id: 'sys-msg-resolved' });

      const result = await service.resolveConversation(mockTenant, 'conv-1', false);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.RESOLVED },
      });
      expect(result.status).toBe(ConversationStatus.RESOLVED);
    });

    it('should set status to BOT when returnToBot is true', async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', tenantId: mockTenant.id });
      prisma.conversation.update.mockResolvedValue({ id: 'conv-1', status: ConversationStatus.BOT });
      prisma.message.create.mockResolvedValue({ id: 'sys-msg-bot' });

      const result = await service.resolveConversation(mockTenant, 'conv-1', true);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.BOT },
      });
      expect(result.status).toBe(ConversationStatus.BOT);
    });
  });

  describe('escalateConversation', () => {
    it('should update status to PENDING_HUMAN', async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', tenantId: mockTenant.id });
      prisma.conversation.update.mockResolvedValue({ id: 'conv-1', status: ConversationStatus.PENDING_HUMAN });

      const result = await service.escalateConversation(mockTenant, 'conv-1');

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.PENDING_HUMAN },
      });
      expect(result.status).toBe(ConversationStatus.PENDING_HUMAN);
    });
  });
});
