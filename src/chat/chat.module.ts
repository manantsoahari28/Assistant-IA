// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [KnowledgeModule],
  controllers: [ChatController],
  providers: [ChatService, KnowledgeService],
})
export class ChatModule {}