// Imports the official French medicine catalogue into the Medicament table.
//
// The source is the "base de données publique des médicaments" (ANSM /
// data.gouv). A filtered copy lives in prisma/data/medicaments-bdpm.tsv so
// this runs offline and reproducibly — a deploy must never depend on a
// third-party site being up. Refresh it with scripts/refresh-bdpm.sh.
//
// Idempotent: safe to run on every deploy, right after `migrate deploy`.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// `@prisma/client` and the adapter are CommonJS. Node 24 can usually pick
// their named exports out of an ESM `import`, Node 22 (the one in the
// migrate image) cannot — it fails with "Named export 'PrismaClient' not
// found". Going through createRequire works on every version, and the `as
// typeof import(...)` casts keep the types.
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
const { PrismaMariaDb } =
  require("@prisma/adapter-mariadb") as typeof import("@prisma/adapter-mariadb");

const CHUNK = 1000;

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });

async function main() {
  const file = join(import.meta.dirname, "data", "medicaments-bdpm.tsv");
  const lignes = readFileSync(file, "utf8").split("\n").filter(Boolean);

  const medicaments = lignes.map((ligne) => {
    const [codeCis, denomination, formePharmaceutique] = ligne.split("\t");
    return {
      codeCis,
      denomination: denomination.trim(),
      formePharmaceutique: formePharmaceutique?.trim() ?? "",
    };
  });

  let inseres = 0;
  for (let i = 0; i < medicaments.length; i += CHUNK) {
    const { count } = await prisma.medicament.createMany({
      data: medicaments.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    inseres += count;
  }

  console.log(
    `[seed] référentiel médicaments : ${inseres} ajouté(s), ${medicaments.length} dans le fichier.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
