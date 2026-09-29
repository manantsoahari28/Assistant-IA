// src/auth/tenant.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Clé API manquante (en-tête x-api-key requis)');
    }

    // Recherche de l'entreprise associée à la clé API
    const tenant = await this.prisma.tenant.findUnique({
      where: { apiKeyHash: apiKey },
    });

    if (!tenant) {
      throw new UnauthorizedException('Clé API invalide');
    }

    // On attache le tenant trouvé à la requête HTTP
    request.tenant = tenant;
    return true;
  }
}