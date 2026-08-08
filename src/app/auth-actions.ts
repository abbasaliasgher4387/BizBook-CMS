"use server";

// Every function here is a trust boundary: each states who may call it on its
// first line.
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  MAX_PASSWORD,
  MIN_PASSWORD,
  checkPassword,
  clearFailures,
  endSession,
  hashPassword,
  isLockedOut,
  recordFailure,
  requireAdmin,
  requireUser,
  startSession,
  verifyPassword,
  wasteVerification,
} from "@/lib/auth";
import { text } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Role } from "../../generated/prisma/enums";

/** Usernames are typed at a keyboard every morning: one case, no spaces. */
function readUsername(fd: FormData): string {
  const username = String(fd.get("username") ?? "")
    .trim()
    .toLowerCase();
  // Bounded at both ends: an unbounded field is a row nobody meant to store.
  if (!/^[a-z0-9._-]{3,64}$/.test(username)) {
    throw new Error("Username must be 3 to 64 characters: letters, numbers, dot, dash or underscore only.");
  }
  return username;
}

/* --------------------------------------------------------------- signing in */

/** Whoever is on the other end of this request, as far as it can be known. Only
    ever used to count failures against, so a spoofed value costs its owner
    attempts rather than buying any. */
async function callerAddress(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

/** A wrong password is ordinary, so it comes back as a line on the login page.
    The reply is identical whether the username exists or not, or the form
    doubles as a way to find out who works here. */
export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    // A username cannot be longer than this, so anything longer is not a typo.
    // Cutting it here also keeps the throttle map's keys bounded.
    .slice(0, 64);
  const password = String(formData.get("password") ?? "");

  // Counted twice: by name, so one account cannot be ground down from a botnet,
  // and by address, so one machine cannot work through the staff list.
  const byName = `u:${username}`;
  const byAddress = `ip:${await callerAddress()}`;
  if (isLockedOut(byName) || isLockedOut(byAddress)) redirect("/login?error=locked");

  const found = username ? await prisma.user.findUnique({ where: { username } }) : null;
  const user = found && found.isActive ? found : null;
  // Spend the scrypt even when there is nobody to check it against, so the two
  // answers take the same time to come back — see wasteVerification.
  if (!user) wasteVerification(password);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailure(byName);
    recordFailure(byAddress);
    redirect("/login?error=1");
  }

  clearFailures(byName);
  clearFailures(byAddress);
  await startSession(user);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

/* -------------------------------------------------------- your own password */

export async function changeMyPassword(formData: FormData) {
  const me = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!verifyPassword(current, user.passwordHash)) redirect("/account?error=wrong");
  if (next.length < MIN_PASSWORD) redirect("/account?error=short");
  if (next.length > MAX_PASSWORD) redirect("/account?error=long");
  if (next === current) redirect("/account?error=same");

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: hashPassword(next) },
  });
  // The old cookie was signed with the old hash and is worthless now — issue a
  // fresh one so changing your password does not sign you out of this browser.
  await startSession(updated);

  redirect("/account?changed=1");
}

/* ------------------------------------------------------------ admin: users */

/** There must always be one active administrator, or nobody can get back in. */
async function assertAdminRemains(userId: string, stillAdmin: boolean) {
  if (stillAdmin) return;
  const others = await prisma.user.count({ where: { role: "ADMIN", isActive: true, id: { not: userId } } });
  if (others === 0) {
    throw new Error("This is the only administrator left. Make someone else an administrator first.");
  }
}

export async function saveUser(formData: FormData) {
  const me = await requireAdmin();

  const id = text(formData.get("id"));
  const username = readUsername(formData);
  const role = (String(formData.get("role")) === "ADMIN" ? "ADMIN" : "USER") as Role;
  const isActive = formData.get("isActive") === "on";
  const password = String(formData.get("password") ?? "");
  const name = text(formData.get("name"));

  try {
    if (id) {
      await assertAdminRemains(id, role === "ADMIN" && isActive);
      const updated = await prisma.user.update({
        where: { id },
        data: {
          username,
          name,
          role,
          isActive,
          // Blank means "leave it alone" — an admin correcting a spelling should
          // not have to know, or retype, that person's password.
          ...(password ? { passwordHash: hashPassword(checkPassword(password)) } : {}),
        },
      });
      // Resetting your own password invalidates your own cookie; re-sign it.
      if (password && id === me.id) await startSession(updated);
    } else {
      await prisma.user.create({
        data: { username, name, role, isActive, passwordHash: hashPassword(checkPassword(password)) },
      });
    }
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw new Error(`The username "${username}" is already taken.`);
    throw e;
  }

  revalidatePath("/users");
}

export async function deleteUser(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("User is required.");
  if (id === me.id) throw new Error("You cannot delete the account you are signed in with.");

  await assertAdminRemains(id, false);
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
}
