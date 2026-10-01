import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    listSessionBranches,
    createSessionBranch,
} from "@/lib/demo/neon-branches";
import {
    cleanupExpiredSessionBranches,
    resetSharedBranchIfStale,
} from "@/lib/demo/maintenance";
import {
    DEMO_COOKIE_NAME,
    encryptDemoSession,
    type DemoSession,
} from "@/lib/demo/session-cookie";
import {
    SESSION_TTL_SECONDS,
    MAX_SESSION_BRANCHES,
} from "@/lib/demo/constants";
import { internalError } from "@/lib/api-utils";

export async function POST() {
    if (process.env.IS_DEMO !== "true") {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    try {
        // Opportunistic housekeeping, piggybacked on real traffic — see
        // src/lib/demo/maintenance.ts for why this replaces a frequent cron.
        await cleanupExpiredSessionBranches();

        const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
        const activeSessionBranches = await listSessionBranches();

        let session: DemoSession = { kind: "shared", expiresAt };
        if (activeSessionBranches.length < MAX_SESSION_BRANCHES) {
            const created = await createSessionBranch();
            if (created) {
                session = {
                    kind: "session",
                    branchId: created.branchId,
                    connectionString: created.connectionString,
                    expiresAt,
                };
            }
            // else: Neon rejected the create (e.g. limit hit despite the
            // soft check above) — fall through to the shared branch.
        }

        if (session.kind === "shared") {
            await resetSharedBranchIfStale().catch(() => {
                // Best-effort — worst case this visitor sees slightly
                // stale shared data instead of a failed sign-in.
            });
        }

        const cookieStore = await cookies();
        cookieStore.set(DEMO_COOKIE_NAME, await encryptDemoSession(session), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_TTL_SECONDS,
        });

        return NextResponse.json({ ok: true, kind: session.kind });
    } catch {
        return internalError();
    }
}
