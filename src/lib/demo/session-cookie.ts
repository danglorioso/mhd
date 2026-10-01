/**
 * Encrypts/decrypts the demo-mode session cookie value.
 *
 * Uses Web Crypto (globalThis.crypto.subtle) rather than Node's `crypto`
 * module so the same code runs unmodified in both `src/proxy.ts`
 * (middleware) and route handlers, regardless of runtime.
 */

export const DEMO_COOKIE_NAME = "mhd_demo_db";

export type DemoSession =
    | {
          kind: "session";
          branchId: string;
          connectionString: string;
          expiresAt: number;
      }
    | {
          kind: "shared";
          expiresAt: number;
      };

let cachedKey: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
    if (!cachedKey) {
        const secret = process.env.DEMO_COOKIE_SECRET;
        if (!secret) {
            throw new Error("DEMO_COOKIE_SECRET is not set");
        }
        cachedKey = crypto.subtle
            .digest("SHA-256", new TextEncoder().encode(secret))
            .then((digest) =>
                crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
                    "encrypt",
                    "decrypt",
                ]),
            );
    }
    return cachedKey;
}

function toBase64Url(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export async function encryptDemoSession(
    session: DemoSession,
): Promise<string> {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(session));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv } as AesGcmParams,
        key,
        plaintext,
    );
    return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

/** Returns the decoded session, or null if missing, tampered, malformed, or expired. */
export async function decryptDemoSession(
    cookieValue: string | undefined,
): Promise<DemoSession | null> {
    if (!cookieValue) return null;
    const [ivPart, ciphertextPart] = cookieValue.split(".");
    if (!ivPart || !ciphertextPart) return null;

    try {
        const key = await getKey();
        const iv = fromBase64Url(ivPart);
        const ciphertext = fromBase64Url(ciphertextPart);
        const plaintext = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv } as AesGcmParams,
            key,
            ciphertext as BufferSource,
        );
        const session = JSON.parse(
            new TextDecoder().decode(plaintext),
        ) as DemoSession;

        if (typeof session.expiresAt !== "number") return null;
        if (session.expiresAt <= Date.now()) return null;
        if (session.kind === "session" && !session.connectionString)
            return null;

        return session;
    } catch {
        return null;
    }
}
