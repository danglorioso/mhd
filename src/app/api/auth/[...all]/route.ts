import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Demo mode never uses real sign-in, and this route isn't covered by the
// proxy's auth gate (it has to stay reachable pre-login) — so it must
// refuse to run here itself. Otherwise a demo visitor could add their own
// email via the Settings page (which writes to their own sandboxed branch)
// and then hit the email-OTP endpoint directly to trigger a real email
// through Resend.
function demoGuard(): NextResponse | null {
    if (process.env.IS_DEMO === "true") {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }
    return null;
}

export async function GET(req: Request) {
    return demoGuard() ?? toNextJsHandler(await getAuth()).GET(req);
}

export async function POST(req: Request) {
    return demoGuard() ?? toNextJsHandler(await getAuth()).POST(req);
}
