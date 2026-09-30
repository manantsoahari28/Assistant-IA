import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus, Tenant } from '@prisma/client';
import { TenantGuard } from '../auth/tenant.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AgentMessageDto } from './dto/agent-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: {
    handleUserMessage: jest.Mock;
    getConversations: jest.Mock;
    getConversationById: jest.Mock;
    takeOverConversation: jest.Mock;
    sendAgentMessage: jest.Mock;
    resolveConversation: jest.Mock;
    escalateConversation: jest.Mock;
  };

  const mockTenant: Tenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    apiKeyHash: 'hash-123',
    botSystemPrompt: 'Prompt',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    chatService = {
      handleUserMessage: jest.fn(),
      getConversations: jest.fn(),
      getConversationById: jest.fn(),
      takeOverConversation: jest.fn(),
      sendAgentMessage: jest.fn(),
      resolveConversation: jest.fn(),
      escalateConversation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should call chatService.handleUserMessage and return response', async () => {
      const dto: SendMessageDto = {
        message: 'Bonjour, besoin d aide',
        conversationId: 'conv-1',
      };
      const expectedResponse = {
        conversationId: 'conv-1',
        status: ConversationStatus.BOT,
        reply: 'Bonjour ! Comment puis-je vous aider ?',
        messageId: 'msg-1',
      };

      chatService.handleUserMessage.mockResolvedValue(expectedResponse);

      const result = await controller.sendMessage(mockTenant, dto);

      expect(chatService.handleUserMessage).toHaveBeenCalledWith(mockTenant, dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getConversations', () => {
    it('should call chatService.getConversations with status', async () => {
      const expectedList = [{ id: 'conv-1', status: ConversationStatus.BOT }];
      chatService.getConversations.mockResolvedValue(expectedList);

      const result = await controller.getConversations(mockTenant, ConversationStatus.BOT);

      expect(chatService.getConversations).toHaveBeenCalledWith(mockTenant, ConversationStatus.BOT);
      expect(result).toEqual(expectedList);
    });
  });

  describe('getPendingConversations', () => {
    it('should call chatService.getConversations with PENDING_HUMAN', async () => {
      const expectedList = [{ id: 'conv-2', status: ConversationStatus.PENDING_HUMAN }];
      chatService.getConversations.mockResolvedValue(expectedList);

      const result = await controller.getPendingConversations(mockTenant);

      expect(chatService.getConversations).toHaveBeenCalledWith(
        mockTenant,
        ConversationStatus.PENDING_HUMAN,
      );
      expect(result).toEqual(expectedList);
    });
  });

  describe('getConversation', () => {
    it('should call chatService.getConversationById', async () => {
      const expectedConv = { id: 'conv-1', messages: [] };
      chatService.getConversationById.mockResolvedValue(expectedConv);

      const result = await controller.getConversation(mockTenant, 'conv-1');

      expect(chatService.getConversationById).toHaveBeenCalledWith(mockTenant, 'conv-1');
      expect(result).toEqual(expectedConv);
    });
  });

  describe('takeOver', () => {
    it('should call chatService.takeOverConversation', async () => {
      const expectedResult = {
        conversationId: 'conv-1',
        status: ConversationStatus.HUMAN_ACTIVE,
        message: 'Sarah a pris en charge la conversation.',
      };
      chatService.takeOverConversation.mockResolvedValue(expectedResult);

      const result = await controller.takeOver(mockTenant, 'conv-1', 'Sarah');

      expect(chatService.takeOverConversation).toHaveBeenCalledWith(mockTenant, 'conv-1', 'Sarah');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('sendAgentMessage', () => {
    it('should call chatService.sendAgentMessage', async () => {
      const dto: AgentMessageDto = {
        message: 'Je prends le relais',
        agentName: 'Sarah',
      };
      const expectedResult = {
        conversationId: 'conv-1',
        status: ConversationStatus.HUMAN_ACTIVE,
        messageId: 'msg-agent-1',
        content: dto.message,
        agentName: 'Sarah',
      };
      chatService.sendAgentMessage.mockResolvedValue(expectedResult);

      const result = await controller.sendAgentMessage(mockTenant, 'conv-1', dto);

      expect(chatService.sendAgentMessage).toHaveBeenCalledWith(mockTenant, 'conv-1', dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resolveConversation', () => {
    it('should call chatService.resolveConversation', async () => {
      const expectedResult = {
        conversationId: 'conv-1',
        status: ConversationStatus.CLOSED,
        message: 'La conversation a été clôturée par le conseiller.',
      };
      chatService.resolveConversation.mockResolvedValue(expectedResult);

      const result = await controller.resolveConversation(mockTenant, 'conv-1', false);

      expect(chatService.resolveConversation).toHaveBeenCalledWith(mockTenant, 'conv-1', false);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('escalateConversation', () => {
    it('should call chatService.escalateConversation', async () => {
      const expectedResult = {
        conversationId: 'conv-1',
        status: ConversationStatus.PENDING_HUMAN,
        message: 'Conversation passée en attente d un conseiller humain (PENDING_HUMAN).',
      };
      chatService.escalateConversation.mockResolvedValue(expectedResult);

      const result = await controller.escalateConversation(mockTenant, 'conv-1');

      expect(chatService.escalateConversation).toHaveBeenCalledWith(mockTenant, 'conv-1');
      expect(result).toEqual(expectedResult);
    });
  });
});
