// Sign-in for one office. No provider, no token library, no session table —
// Node's own crypto does both jobs the app needs: scrypt to store a password,
// HMAC to sign the cookie that says who is holding the browser.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "../../generated/prisma/enums";

export const SESSION_COOKIE = "bizbook_session";
/** Two weeks. Long enough that the office is not asked to log in twice a day. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function secret(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv) return fromEnv;
  // A shared fallback would let anyone who has read this file mint a valid
  // cookie, so it is allowed on a developer's machine and nowhere else.
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set. Put a long random string in .env before deploying.");
  }
  return "bizbook-development-secret-not-for-production";
}

/* ---------------------------------------------------------------- passwords */

/** scrypt with a fresh 16-byte salt, stored as "salt:key" in hex. Memory-hard
    by design, so a stolen table cannot be run through a GPU dictionary. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(plain, salt, 64).toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = Buffer.from(keyHex, "hex");
  if (key.length === 0) return false;
  // Constant time: a plain === would leak how much of the key was guessed.
  return timingSafeEqual(key, scryptSync(plain, Buffer.from(saltHex, "hex"), key.length));
}

/** The one rule on new passwords. Anything longer is the user's business. */
export const MIN_PASSWORD = 6;

export function checkPassword(plain: string): string {
  if (plain.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters long.`);
  return plain;
}

/* ----------------------------------------------------------------- sessions */

/**
 * The signature covers the stored password hash as well as the id and expiry.
 * That is what makes "change my password" mean something: the hash changes, so
 * every cookie already issued for the account stops verifying — including the
 * one on whatever machine the password leaked from.
 */
function sign(userId: string, expires: number, passwordHash: string): string {
  return createHmac("sha256", secret()).update(`${userId}.${expires}.${passwordHash}`).digest("hex");
}

export async function startSession(user: { id: string; passwordHash: string }) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  (await cookies()).set(SESSION_COOKIE, `${user.id}.${expires}.${sign(user.id, expires, user.passwordHash)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * ponytail: signing out clears the cookie in this browser, but the cookie is
 * self-contained, so a copy taken off the machine beforehand keeps working
 * until it expires. Changing the password is what actually revokes it. Add a
 * tokenVersion column — bumped here, folded into sign() — if that ever matters.
 */
export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; username: string; name: string | null; role: Role };

/**
 * Who is making this request, or null. The account is re-read every time rather
 * than trusted from the cookie, so an admin switching someone off or resetting
 * their password takes effect on that person's very next page.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [id, expiresRaw, mac] = raw.split(".");
  const expires = Number(expiresRaw);
  if (!id || !mac || !Number.isFinite(expires) || expires < Date.now()) return null;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isActive) return null;

  const expected = sign(id, expires, user.passwordHash);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;

  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

/** For pages and actions: past this line there is a signed-in user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** Same, and they run the place. Anyone else is sent back to the dashboard —
    User management is not a page a normal user is told exists. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/**
 * First run: there is no account to sign in with, so the one the client was
 * given is created here. Does nothing the moment any user exists — including
 * after that first admin has renamed themselves or changed the password.
 *
 * Returns true only on the run that created it, so the login page can say so.
 */
export async function ensureAdmin(): Promise<boolean> {
  if ((await prisma.user.count()) > 0) return false;
  try {
    await prisma.user.create({
      data: {
        username: "administrator",
        name: "Administrator",
        role: "ADMIN",
        passwordHash: hashPassword("admin123"),
      },
    });
    return true;
  } catch {
    // Two first visits in the same second: the unique username wins, and the
    // loser has nothing to report because the account now exists either way.
    return false;
  }
}
