import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { apiKeyHash: 'cle-api-test-123' },
    update: {},
    create: {
      name: 'Entreprise De Démo',
      apiKeyHash: 'cle-api-test-123', // En production, cette clé sera hashée
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
