/**
 * Housekeeping for demo mode: expiring stale per-visitor branches and
 * resetting the shared-overflow branch. Vercel's Hobby plan only allows
 * cron jobs to run once a day (more frequent schedules fail at deploy
 * time), so both of these are designed to run opportunistically — piggy-
 * backed on real visitor traffic in `/api/demo/start` — with a once-daily
 * cron (`/api/demo/cron`) as a safety net for quiet stretches with no
 * visitors.
 */

import { desc } from "drizzle-orm";
import { listSessionBranches, deleteBranch } from "@/lib/demo/neon-branches";
import { connectTo } from "@/lib/demo/direct-db";
import { insertSeedData } from "@/lib/demo/seed-data";
import {
    schools,
    teachers,
    projects,
    yearlySchoolParticipation,
    yearlyTeacherParticipation,
    yearMetadata,
    schoolHistoricNames,
} from "@/lib/schema";
import {
    SESSION_TTL_SECONDS,
    SHARED_RESET_INTERVAL_SECONDS,
} from "@/lib/demo/constants";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

/** Deletes any per-visitor branch older than the session TTL. Cheap — safe to call on every visit. */
export async function cleanupExpiredSessionBranches(): Promise<number> {
    const branches = await listSessionBranches();
    const now = Date.now();
    const expired = branches.filter(
        (b) =>
            now - new Date(b.created_at).getTime() > SESSION_TTL_SECONDS * 1000,
    );
    await Promise.all(expired.map((b) => deleteBranch(b.id)));
    return expired.length;
}

async function resetSharedBranchData(sharedDb: ReturnType<typeof connectTo>) {
    // Children before parents to satisfy foreign keys.
    await sharedDb.delete(projects);
    await sharedDb.delete(yearlyTeacherParticipation);
    await sharedDb.delete(yearlySchoolParticipation);
    await sharedDb.delete(schoolHistoricNames);
    await sharedDb.delete(yearMetadata);
    await sharedDb.delete(teachers);
    await sharedDb.delete(schools);
    await insertSeedData(sharedDb);
}

/**
 * Resets the shared branch's data if it's stale (or has never been
 * seeded). Cheap when a reset isn't due — just one query.
 */
export async function resetSharedBranchIfStale(): Promise<boolean> {
    const sharedDb = connectTo(requireEnv("NEON_SHARED_BRANCH_URL"));

    const [mostRecent] = await sharedDb
        .select({ lastUpdatedAt: yearMetadata.lastUpdatedAt })
        .from(yearMetadata)
        .orderBy(desc(yearMetadata.lastUpdatedAt))
        .limit(1);

    const lastResetAt = mostRecent?.lastUpdatedAt?.getTime() ?? 0;
    const isStale =
        Date.now() - lastResetAt > SHARED_RESET_INTERVAL_SECONDS * 1000;
    if (!isStale) return false;

    await resetSharedBranchData(sharedDb);
    return true;
}
