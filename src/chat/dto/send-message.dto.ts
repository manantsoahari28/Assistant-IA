// src/chat/dto/send-message.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message de l\'utilisateur',
    example: 'Bonjour ! Quel est le délai de retour d\'un article ?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Identifiant de la conversation existante (si absent, une nouvelle conversation est créée)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Forcer le transfert vers un conseiller humain (true = PENDING_HUMAN)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requestHuman?: boolean;
}