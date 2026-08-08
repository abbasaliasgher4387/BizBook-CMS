// Sign-in for one office: no provider, no token library, no session table.
// scrypt stores the password, HMAC signs the cookie.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "../../generated/prisma/enums";

export const SESSION_COOKIE = "bizbook_session";
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

/** The one rule on new passwords. Anything longer is the user's business. */
export const MIN_PASSWORD = 6;
/** Not a policy, a ceiling — see verifyPassword. */
export const MAX_PASSWORD = 200;

export function verifyPassword(plain: string, stored: string): boolean {
  // scrypt is deliberately expensive and the login form is open to the world:
  // without this line a one-megabyte "password" is a free way to pin a CPU.
  if (plain.length > MAX_PASSWORD) return false;
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = Buffer.from(keyHex, "hex");
  if (key.length === 0) return false;
  // Constant time: a plain === would leak how much of the key was guessed.
  return timingSafeEqual(key, scryptSync(plain, Buffer.from(saltHex, "hex"), key.length));
}

export function checkPassword(plain: string): string {
  if (plain.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters long.`);
  if (plain.length > MAX_PASSWORD) throw new Error(`Password must be at most ${MAX_PASSWORD} characters long.`);
  return plain;
}

/**
 * A hash of nothing, so a username that does not exist can be made to cost the
 * same scrypt as one that does. Without it the login form answers "no such
 * user" in a millisecond and "wrong password" in a hundred — which is a staff
 * list for anyone holding a stopwatch.
 */
const DECOY_HASH = hashPassword(randomBytes(32).toString("hex"));

/** Burns one scrypt so a failed lookup costs what a failed password costs. */
export function wasteVerification(plain: string): void {
  verifyPassword(plain, DECOY_HASH);
}

/* --------------------------------------------------------- guessing the door */

/**
 * Failed sign-ins, counted per username and per source address. Six characters
 * is the floor on a password, so given unlimited tries a dictionary gets there;
 * this shuts the door long before it does.
 *
 * ponytail: a Map in this process — a restart forgives, and a second instance
 * counts separately. Right size for one office on one server; move the counter
 * into Postgres if this is ever scaled out.
 */
const LOCK_AFTER = 8;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; until: number }>();

export function isLockedOut(key: string): boolean {
  const hit = attempts.get(key);
  return hit !== undefined && hit.count >= LOCK_AFTER && hit.until > Date.now();
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const hit = attempts.get(key);
  // A fresh window once the old one has run out, so yesterday's typo does not
  // count towards today.
  attempts.set(
    key,
    hit && hit.until > now ? { count: hit.count + 1, until: hit.until } : { count: 1, until: now + LOCK_WINDOW_MS },
  );

  // Half of every key is a string the caller chooses, so nothing stops the map
  // growing until it is the outage. Sweep the expired entries.
  if (attempts.size > 2000) {
    for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  }
}

export function clearFailures(key: string): void {
  attempts.delete(key);
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
 * The password the very first administrator is created with.
 *
 * "admin123" is fine on a laptop and indefensible on a public URL: the account
 * name is in this file, the app creates it by itself, and the first stranger to
 * find the login page is inside. So production must name its own, and a
 * deployment that has not is told exactly what is missing.
 */
function firstAdminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv) return checkPassword(fromEnv);
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_PASSWORD is not set. This database has no users yet; put the first administrator's password in the environment before opening the site.",
    );
  }
  return "admin123";
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
  // Read before the create, so a production deployment missing the variable
  // fails loudly instead of quietly standing up a guessable account.
  const password = firstAdminPassword();
  try {
    await prisma.user.create({
      data: {
        username: "administrator",
        name: "Administrator",
        role: "ADMIN",
        passwordHash: hashPassword(password),
      },
    });
    return true;
  } catch {
    // Two first visits in the same second: the unique username wins, and the
    // loser has nothing to report because the account now exists either way.
    return false;
  }
}
