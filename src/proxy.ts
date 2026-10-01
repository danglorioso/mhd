import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getSession } from "@/lib/auth-session";
import {
    DEMO_COOKIE_NAME,
    decryptDemoSession,
} from "@/lib/demo/session-cookie";

const IS_DEMO = process.env.IS_DEMO === "true";
const ENTRY_PATH = IS_DEMO ? "/demo/start" : "/signin";

function safeRedirectTarget(redirect: string | null): string {
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        return redirect;
    }
    return "/";
}

async function isDemoSessionValid(request: NextRequest): Promise<boolean> {
    const cookieValue = request.cookies.get(DEMO_COOKIE_NAME)?.value;
    const session = await decryptDemoSession(cookieValue);
    return session !== null;
}

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isSignedIn = IS_DEMO
        ? await isDemoSessionValid(request)
        : Boolean(await getSession());

    if (pathname === ENTRY_PATH) {
        if (isSignedIn) {
            const redirect = request.nextUrl.searchParams.get("redirect");
            return NextResponse.redirect(
                new URL(safeRedirectTarget(redirect), request.url),
            );
        }
        return NextResponse.next();
    }

    if (!isSignedIn) {
        const entryUrl = new URL(ENTRY_PATH, request.url);
        const originalPath = request.nextUrl.pathname + request.nextUrl.search;
        entryUrl.searchParams.set("redirect", originalPath);
        return NextResponse.redirect(entryUrl);
    }

    if (!IS_DEMO) {
        const sessionCookie = getSessionCookie(request);
        if (!sessionCookie) {
            const signinUrl = new URL("/signin", request.url);
            const originalPath =
                request.nextUrl.pathname + request.nextUrl.search;
            signinUrl.searchParams.set("redirect", originalPath);
            return NextResponse.redirect(signinUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    // Protect all routes except the sign-in/demo-entry page, and API auth routes
    matcher: [
        /*
         * Match all request paths except:
         * - /api/auth/* (auth API routes)
         * - /api/demo/start (issues the demo cookie itself, so must be reachable
         *   before one exists)
         * - /api/demo/cron (hit by Vercel Cron directly, with its own bearer-token
         *   auth instead of a session)
         * - /_next/* (Next.js internals)
         * - /*.* (files with extensions like favicon.ico, images, etc.)
         * Note: signin/demo-start IS matched so we can redirect to / when already signed in
         */
        "/((?!api/auth|api/check-email|api/demo/start|api/demo/cron|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
    ],
};
