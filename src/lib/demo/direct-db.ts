import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/schema";

/**
 * Connects directly to a given Neon connection string, bypassing the
 * cookie-based routing in src/lib/db.ts. For use by the one-off seed
 * script and the cron job resetting the shared branch — neither has a
 * visitor's demo cookie to read.
 */
export function connectTo(connectionString: string) {
    return drizzle(neon(connectionString), { schema });
}
