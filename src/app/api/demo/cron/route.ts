import { NextRequest, NextResponse } from "next/server";
import {
    cleanupExpiredSessionBranches,
    resetSharedBranchIfStale,
} from "@/lib/demo/maintenance";

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Once-daily safety net (see vercel.json — Vercel's Hobby plan doesn't
 * allow more frequent cron schedules) for quiet stretches with no
 * visitors to piggyback the opportunistic cleanup in
 * src/app/api/demo/start/route.ts onto.
 */
export async function GET(request: NextRequest) {
    if (process.env.IS_DEMO !== "true") {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedSessionBranches = await cleanupExpiredSessionBranches();
    const sharedBranchReset = await resetSharedBranchIfStale();

    return NextResponse.json({ deletedSessionBranches, sharedBranchReset });
}
