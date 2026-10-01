import { getAuth } from "./auth";
import { headers } from "next/headers";

export async function getSession() {
    return (await getAuth()).api.getSession({ headers: await headers() });
}
