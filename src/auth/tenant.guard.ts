// src/auth/tenant.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Tenant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CachedTenantEntry {
  tenant: Tenant;
  expiresAt: number;
}

@Injectable()
export class TenantGuard implements CanActivate {
  private static tenantCache = new Map<string, CachedTenantEntry>();
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Efface l'ensemble du cache mémoire
   */
  static clearCache(): void {
    TenantGuard.tenantCache.clear();
  }

  /**
   * Invalide les entrées associées à un tenantId spécifique
   */
  static invalidateTenant(tenantId: string): void {
    for (const [key, entry] of TenantGuard.tenantCache.entries()) {
      if (entry.tenant.id === tenantId) {
        TenantGuard.tenantCache.delete(key);
      }
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Clé API manquante (en-tête x-api-key requis)');
    }

    const now = Date.now();
    const cached = TenantGuard.tenantCache.get(apiKey);
    if (cached && cached.expiresAt > now) {
      request.tenant = cached.tenant;
      return true;
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

    TenantGuard.tenantCache.set(apiKey, {
      tenant,
      expiresAt: now + TenantGuard.CACHE_TTL_MS,
    });

    // On attache le tenant trouvé à la requête HTTP
    request.tenant = tenant;
    return true;
  }
}