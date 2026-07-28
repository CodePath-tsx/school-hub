// Ed25519 license verifier. Matches the format produced by
// scripts/license-generator.mjs:  MB1.<payloadB64url>.<sigB64url>
//
// The vendor's public key is embedded below (base64url of SPKI DER, same
// value the CLI prints after `keygen`). Replace it with your own after
// running keygen, and never commit the private key.

export const VENDOR_PUBLIC_KEY_B64URL =
  "MCowBQYDK2VwAyEAN6_l3GpmY5ORuWGbwmFvYQQCfS6IO943pl-LrylF_Oo";

export type LicenseType = "trial" | "subscription" | "lifetime" | "enterprise";

export interface LicensePayload {
  customer: string;
  company: string;
  machineId: string; // empty string = wildcard/developer key
  type: LicenseType;
  issuedAt: string;
  expiresAt?: string;
  features: string[];
  nonce: string;
}

export interface VerifyResult {
  ok: boolean;
  payload?: LicensePayload;
  error?: string;
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importVendorKey(): Promise<CryptoKey> {
  const raw = b64urlToBytes(VENDOR_PUBLIC_KEY_B64URL);
  // Copy into a plain ArrayBuffer for SubtleCrypto
  const buf = new ArrayBuffer(raw.byteLength);
  new Uint8Array(buf).set(raw);
  return crypto.subtle.importKey("spki", buf, { name: "Ed25519" }, false, ["verify"]);
}

export async function verifyLicense(key: string, machineId: string): Promise<VerifyResult> {
  try {
    if (!key || !key.startsWith("MB1.")) return { ok: false, error: "Invalid license format." };
    const parts = key.split(".");
    if (parts.length !== 3) return { ok: false, error: "Malformed license key." };
    const [, payloadB64, sigB64] = parts;
    const payloadBytes = b64urlToBytes(payloadB64);
    const sigBytes = b64urlToBytes(sigB64);

    let pubKey: CryptoKey;
    try {
      pubKey = await importVendorKey();
    } catch {
      return { ok: false, error: "This browser does not support Ed25519 verification." };
    }
    const okSig = await crypto.subtle.verify("Ed25519", pubKey, sigBytes, payloadBytes);
    if (!okSig) return { ok: false, error: "Signature is invalid." };

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as LicensePayload;

    if (payload.machineId && payload.machineId !== machineId) {
      return { ok: false, error: "License is bound to a different machine." };
    }
    if (payload.expiresAt && Date.parse(payload.expiresAt) < Date.now()) {
      return { ok: false, error: "License has expired." };
    }
    return { ok: true, payload };
  } catch (e) {
    return { ok: false, error: (e as Error).message ?? "License verification failed." };
  }
}

/**
 * Produces a stable machine fingerprint.
 * In Electron main we'd derive it from MAC + hostname + cpu model; in the
 * browser preview we persist a random UUID keyed to this install so the
 * license flow can be tested end-to-end without a native runtime.
 */
export function getMachineId(): string {
  const KEY = "schoolbyte.hwid";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const rand = new Uint8Array(8);
      crypto.getRandomValues(rand);
      id = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "0000000000000000";
  }
}

export function formatLicenseKey(raw: string): string {
  return raw.trim();
}
