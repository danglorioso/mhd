import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/schema";
import { cookies } from "next/headers";
import {
    DEMO_COOKIE_NAME,
    decryptDemoSession,
} from "@/lib/demo/session-cookie";

type Db = ReturnType<typeof drizzle<typeof schema>>;

export class DemoSessionExpiredError extends Error {
    constructor() {
        super("Demo session expired or missing");
        this.name = "DemoSessionExpiredError";
    }
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

const isDemo = process.env.IS_DEMO === "true";

let _db: Db | null = null;

// Lazily initialized so importing this module never touches DATABASE_URL —
// only calling getDb() does. Without this, `next build` crashes during page
// data collection on any deploy where the database hasn't been provisioned
// yet (e.g. before the Neon integration is added).
function getProdDb(): Db {
    if (!_db) {
        const sql = neon(requireEnv("DATABASE_URL"));
        _db = drizzle(sql, { schema });
    }
    return _db;
}

// Demo mode routes every request to a per-visitor (or shared-overflow)
// Neon branch, addressed by an encrypted cookie rather than one fixed
// DATABASE_URL — see src/lib/demo/session-cookie.ts and
// src/app/api/demo/start/route.ts. Instances are cached by connection
// string, capped so a long-lived warm serverless instance can't grow this
// unboundedly across many visitors.
const DEMO_DB_CACHE_LIMIT = 20;
const demoDbCache = new Map<string, Db>();

function getDemoDbFor(connectionString: string): Db {
    let db = demoDbCache.get(connectionString);
    if (!db) {
        db = drizzle(neon(connectionString), { schema });
        if (demoDbCache.size >= DEMO_DB_CACHE_LIMIT) {
            const oldestKey = demoDbCache.keys().next().value;
            if (oldestKey !== undefined) demoDbCache.delete(oldestKey);
        }
        demoDbCache.set(connectionString, db);
    }
    return db;
}

async function getDemoDb(): Promise<Db> {
    const cookieStore = await cookies();
    const session = await decryptDemoSession(
        cookieStore.get(DEMO_COOKIE_NAME)?.value,
    );
    if (!session) throw new DemoSessionExpiredError();

    const connectionString =
        session.kind === "shared"
            ? requireEnv("NEON_SHARED_BRANCH_URL")
            : session.connectionString;

    return getDemoDbFor(connectionString);
}

export async function getDb(): Promise<Db> {
    if (isDemo) return getDemoDb();
    return getProdDb();
}
