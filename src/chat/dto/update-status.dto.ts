// src/chat/dto/update-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ConversationStatus } from '@prisma/client';

export class UpdateConversationStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de la conversation',
    enum: ConversationStatus,
    example: ConversationStatus.PENDING_HUMAN,
  })
  @IsEnum(ConversationStatus)
  @IsNotEmpty()
  status: ConversationStatus;
}
