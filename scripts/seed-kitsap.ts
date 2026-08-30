import type { PrismaClient } from "@prisma/client";

// The one jurisdiction Phase 1 operates in (CLAUDE.md section 29). Upsert by
// slug so this is safe to run more than once.
export async function seedKitsapCounty(prisma: PrismaClient) {
  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { slug: "kitsap-county-wa" },
    update: {},
    create: {
      name: "Kitsap County",
      state: "WA",
      slug: "kitsap-county-wa",
    },
  });

  return jurisdiction;
}
