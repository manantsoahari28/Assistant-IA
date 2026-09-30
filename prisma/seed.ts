import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const apiKey = 'cle-api-test-123';
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const tenant = await prisma.tenant.upsert({
    where: { apiKeyHash },
    update: {},
    create: {
      name: 'Entreprise De Démo',
      apiKeyHash,
      botSystemPrompt: 'Tu es un assistant de support client professionnel, courtois et concis.',
    },
  });

  console.log('✅ Tenant de test créé avec succès :', tenant);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
