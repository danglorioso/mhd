/**
 * Thin client for the Neon branch-management API, used only in demo mode
 * to fork a fresh, isolated database branch per visitor.
 * https://api-docs.neon.tech/reference/createprojectbranch
 */

const NEON_API_BASE = "https://console.neon.tech/api/v2";
export const SESSION_BRANCH_PREFIX = "session-";

type NeonBranch = { id: string; name: string; created_at: string };

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

async function neonFetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${NEON_API_BASE}${path}`, {
        ...init,
        headers: {
            "Authorization": `Bearer ${requireEnv("NEON_API_KEY")}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });
}

/** Lists only the ephemeral per-visitor branches (excludes the seed and shared branches). */
export async function listSessionBranches(): Promise<NeonBranch[]> {
    try {
        const projectId = requireEnv("NEON_PROJECT_ID");
        const res = await neonFetch(
            `/projects/${projectId}/branches?limit=100`,
        );
        if (!res.ok) return [];
        const data = (await res.json()) as { branches?: NeonBranch[] };
        return (data.branches ?? []).filter((b) =>
            b.name.startsWith(SESSION_BRANCH_PREFIX),
        );
    } catch {
        return [];
    }
}

/**
 * Forks a fresh branch from the seed branch. Returns null on any failure
 * (including Neon's branch-limit being hit) so the caller can fall back
 * to the shared branch instead of erroring.
 */
export async function createSessionBranch(): Promise<{
    branchId: string;
    connectionString: string;
} | null> {
    try {
        const projectId = requireEnv("NEON_PROJECT_ID");
        const seedBranchId = requireEnv("NEON_SEED_BRANCH_ID");
        const name = `${SESSION_BRANCH_PREFIX}${Date.now()}-${crypto.randomUUID()}`;

        const res = await neonFetch(`/projects/${projectId}/branches`, {
            method: "POST",
            body: JSON.stringify({
                branch: { parent_id: seedBranchId, name },
                endpoints: [{ type: "read_write" }],
            }),
        });
        if (!res.ok) return null;

        const data = (await res.json()) as {
            branch?: { id?: string };
            connection_uris?: { connection_uri?: string }[];
        };
        const branchId = data.branch?.id;
        const connectionString = data.connection_uris?.[0]?.connection_uri;
        if (!branchId || !connectionString) return null;

        return { branchId, connectionString };
    } catch {
        return null;
    }
}

/** Best-effort delete — a failure here just means the next cron run retries it. */
export async function deleteBranch(branchId: string): Promise<void> {
    try {
        const projectId = requireEnv("NEON_PROJECT_ID");
        await neonFetch(`/projects/${projectId}/branches/${branchId}`, {
            method: "DELETE",
        });
    } catch {
        // ignored — best effort
    }
}
