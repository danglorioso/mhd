/**
 * One-off script that seeds a Neon branch with fake demo data. Run against
 * the demo project's `main` (seed) branch and its `shared` branch during
 * setup — see DEMO.md. Every other branch is a copy-on-write fork of
 * `main`, so it only needs to run twice, ever.
 *
 * Usage: DATABASE_URL=<branch connection string> npx tsx scripts/demo-seed.ts
 */
import "dotenv/config";
import { connectTo } from "../src/lib/demo/direct-db";
import { insertSeedData } from "../src/lib/demo/seed-data";

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error(
            "Set DATABASE_URL to the target branch's connection string first.",
        );
        process.exit(1);
    }

    const db = connectTo(url);
    await insertSeedData(db);
    console.log("Demo seed data inserted.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
