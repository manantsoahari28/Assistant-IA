// src/auth/tenant.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Clé API manquante (en-tête x-api-key requis)');
    }

    // Calcul du hash SHA-256 de la clé API
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Recherche de l'entreprise associée au hash de la clé API
    let tenant = await this.prisma.tenant.findUnique({
      where: { apiKeyHash: hashedKey },
    });

    // Rétrocompatibilité : prise en charge des clés existantes non hashées (ex: seed initial)
    if (!tenant) {
      tenant = await this.prisma.tenant.findUnique({
        where: { apiKeyHash: apiKey },
      });
    }

    if (!tenant) {
      throw new UnauthorizedException('Clé API invalide');
    }

    // On attache le tenant trouvé à la requête HTTP
    request.tenant = tenant;
    return true;
  }
}