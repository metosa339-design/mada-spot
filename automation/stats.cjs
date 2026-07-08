/* Stats Mada Spot — inscriptions & fiches. Usage: node automation/stats.cjs  (depuis la racine du projet) */
const fs = require("fs");
let url = (fs.readFileSync(".env", "utf8").match(/DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/) || [])[1].replace(/[?&]sslmode=[^&]*/, "");
const { Client } = require("pg");
const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
(async () => {
  await c.connect();
  const users = (await c.query(`SELECT COUNT(*)::int n FROM "User"`)).rows[0].n;
  const pros = (await c.query(`SELECT COUNT(*)::int n FROM "User" WHERE "userType" IS NOT NULL`)).rows[0].n;
  const est = (await c.query(`SELECT "claimedByUserId","createdByUserId" FROM "Establishment"`)).rows;
  const o = new Set();
  est.forEach((x) => { if (x.claimedByUserId) o.add(x.claimedByUserId); if (x.createdByUserId) o.add(x.createdByUserId); });
  const withFiche = (await c.query(`SELECT id FROM "User" WHERE "userType" IS NOT NULL`)).rows.filter((x) => o.has(x.id)).length;
  const totalEst = (await c.query(`SELECT COUNT(*)::int n FROM "Establishment"`)).rows[0].n;
  const claimed = (await c.query(`SELECT COUNT(*)::int n FROM "Establishment" WHERE "claimedByUserId" IS NOT NULL`)).rows[0].n;
  console.log("======== STATS MADA SPOT ========");
  console.log("Comptes totaux         :", users);
  console.log("Comptes prestataire    :", pros);
  console.log("  -> AVEC fiche        :", withFiche);
  console.log("  -> SANS fiche        :", pros - withFiche);
  console.log("Fiches (total)         :", totalEst);
  console.log("Fiches revendiquées    :", claimed);
  console.log("=================================");
  await c.end();
})().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
