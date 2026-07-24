import "server-only";

import { cookies } from "next/headers";

export const STAFF_COOKIE_NAME = "reyes_staff_session";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

export async function hasValidStaffSession(email: string): Promise<boolean> {
  const token = (await cookies()).get(STAFF_COOKIE_NAME)?.value;
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator < 1) return false;

  const expiresAt = Number(token.slice(0, separator));
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;

  const expectedToken = await createSessionToken(email, expiresAt);
  return constantTimeEqual(token, expectedToken);
}

export async function startStaffSession(email: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_LIFETIME_SECONDS * 1000;
  const token = await createSessionToken(email, expiresAt);

  (await cookies()).set(STAFF_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_LIFETIME_SECONDS,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isCorrectStaffPassword(password: string): Promise<boolean> {
  const configuredPassword = process.env.STAFF_PASSWORD;
  if (!configuredPassword) return false;

  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(password)),
    crypto.subtle.digest("SHA-256", encoder.encode(configuredPassword)),
  ]);

  return constantTimeEqualBytes(
    new Uint8Array(providedDigest),
    new Uint8Array(expectedDigest),
  );
}

async function createSessionToken(email: string, expiresAt: number): Promise<string> {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("Staff session security is not configured.");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${email.toLowerCase()}|${expiresAt}`),
  );

  return `${expiresAt}.${toBase64Url(new Uint8Array(signature))}`;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return constantTimeEqualBytes(leftBytes, rightBytes);
}

function constantTimeEqualBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}
