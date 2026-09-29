// src/knowledge/dto/add-document.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AddDocumentDto {
  @ApiProperty({
    description: 'Titre du document (affiché dans la liste)',
    example: 'Politique de Retour et Garantie 2026',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Contenu textuel brut du document (FAQ, guide, conditions, etc.). Sera découpé en chunks et vectorisé.',
    example: 'Les clients disposent d\'un délai de 45 jours pour retourner un article non ouvert. Le code de retour est RETOUR-45.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'URL source du document (optionnel, pour traçabilité)',
    example: 'https://mon-site.com/politique-retour',
  })
  @IsUrl()
  @IsOptional()
  sourceUrl?: string;
}