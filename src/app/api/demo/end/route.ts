import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_COOKIE_NAME } from "@/lib/demo/session-cookie";

/** Clears the current visitor's demo cookie — used by the Sidebar's "Sign Out" in demo mode. */
export async function POST() {
    if (process.env.IS_DEMO !== "true") {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.delete(DEMO_COOKIE_NAME);
    return NextResponse.json({ ok: true });
}
