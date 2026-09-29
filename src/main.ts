import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ─── Configuration Swagger / OpenAPI ────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Support IA API')
    .setDescription(
      `
**API backend de support client multi-tenant avec RAG (Retrieval-Augmented Generation)**

## Authentification
Toutes les routes nécessitent l'en-tête \`x-api-key\` avec la clé API du tenant.

## Modules disponibles
- 🤖 **Chat** — Envoi de messages, gestion du Human Handoff (BOT → PENDING_HUMAN → HUMAN_ACTIVE)
- 📚 **Knowledge** — Base de connaissances vectorielle (ajout, liste, suppression de documents)
- 🏢 **Tenant** — Paramètres de l'entreprise (nom, prompt système du bot)
      `.trim(),
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Clé API du tenant (ex: cle-api-test-123)',
      },
      'x-api-key',
    )
    .addTag('chat', 'Messages utilisateurs et gestion du Human Handoff')
    .addTag('knowledge', 'Base de connaissances vectorielle (RAG)')
    .addTag('tenant', 'Paramètres et configuration du tenant')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // La clé API reste mémorisée entre les rechargements
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Support IA — Documentation API',
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar-wrapper .link span { display: none; }
    `,
  });

  await app.listen(3000);
  console.log(`\n✅ Serveur démarré sur : http://localhost:3000`);
  console.log(`📖 Documentation Swagger : http://localhost:3000/api\n`);
}
bootstrap();