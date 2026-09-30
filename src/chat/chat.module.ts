import { Module } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [KnowledgeModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}