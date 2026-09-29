// src/knowledge/dto/add-document.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AddDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string; // Le texte brut du document (FAQ, guide, conditions, etc.)

  @IsUrl()
  @IsOptional()
  sourceUrl?: string;
}