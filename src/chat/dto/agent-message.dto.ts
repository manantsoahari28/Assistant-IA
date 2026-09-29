// src/chat/dto/agent-message.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AgentMessageDto {
  @ApiProperty({
    description: 'Message envoyé par le conseiller humain',
    example: 'Bonjour, je suis Sarah. J\'ai bien pris en charge votre dossier. Que puis-je faire pour vous ?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Nom de l\'agent humain (affiché dans l\'historique)',
    example: 'Sarah du Support',
  })
  @IsString()
  @IsOptional()
  agentName?: string;
}
