import { config } from "dotenv";
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { seedKitsapCounty } from "../scripts/seed-kitsap.ts";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const jurisdiction = await seedKitsapCounty(prisma);
  console.log(`Seeded jurisdiction: ${jurisdiction.name}, ${jurisdiction.state} (${jurisdiction.slug})`);

  await prisma.$disconnect();
}

await main();
