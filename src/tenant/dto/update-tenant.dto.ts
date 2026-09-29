// src/tenant/dto/update-tenant.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Nouveau nom de l\'entreprise',
    example: 'Mon Entreprise Pro',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Prompt système du bot IA (instructions de personnalité et de comportement)',
    example: 'Tu es un assistant IA expert en support technique, réponds toujours de manière concise et professionnelle.',
  })
  @IsString()
  @IsOptional()
  botSystemPrompt?: string;
}
