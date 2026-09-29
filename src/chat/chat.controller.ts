// src/chat/chat.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { Tenant } from '@prisma/client';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { TenantGuard } from '../auth/tenant.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(TenantGuard) // Sécurise toute la route avec le Guard Multi-Tenant
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.handleUserMessage(tenant, dto);
  }
}