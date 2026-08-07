// Admin only. Same shape as Companies — a list of rows that open into their own
// form — because it is the same job: a short list of records the office edits
// rarely and needs to see all of at once.
import { deleteUser, saveUser } from "@/app/auth-actions";
import { PageHeader, btn, fieldLabel, inputClass } from "@/components/ui";
import { MIN_PASSWORD, requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* One grid, shared by the heading and by every row, so the columns stay in line
   while an opened row is still free to run the full width of the card. */
const ROW = "grid min-w-[34rem] grid-cols-[1fr_1fr_5.5rem_6rem_3rem] items-center gap-3 px-3";

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return (
    <>
      <PageHeader
        title="User management"
        subtitle="Who can sign in to Bizbook. Open a row to rename someone, change what they are allowed to do, or reset a forgotten password."
      />

      <div className="overflow-x-auto rounded-md border border-line bg-paper">
        <div
          className={`${ROW} border-b border-line bg-canvas/60 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3`}
        >
          <span>Username</span>
          <span>Name</span>
          <span>Role</span>
          <span>Added</span>
          <span />
        </div>

        <div className="divide-y divide-line-2">
          {users.map((u) => (
            <details key={u.id} className="group">
              <summary
                className={`${ROW} cursor-pointer list-none py-2.5 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13px] font-medium">{u.username}</span>
                  {u.id === me.id && <span className="shrink-0 text-[11px] text-ink-3">you</span>}
                  {!u.isActive && (
                    <span className="shrink-0 rounded-[3px] border border-line bg-canvas px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-3">
                      Off
                    </span>
                  )}
                </span>
                <span className="truncate text-[12.5px] text-ink-2">{u.name ?? "—"}</span>
                <span className="text-[12.5px] text-ink-2">{u.role === "ADMIN" ? "Administrator" : "User"}</span>
                <span className="tnum text-[12.5px] text-ink-2">{shortDate(u.createdAt)}</span>
                <span className="text-right text-[12px] text-ink-3">
                  <span className="group-open:hidden">Edit</span>
                  <span className="hidden group-open:inline">Close</span>
                </span>
              </summary>
              <div className="border-t border-line-2 bg-canvas/40 p-4">
                <UserForm user={u} isSelf={u.id === me.id} />
              </div>
            </details>
          ))}
        </div>
      </div>

      <details className="group mt-4 overflow-hidden rounded-md border border-dashed border-line bg-paper">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-canvas/60 [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Add a user</span>
          <span className="hidden group-open:inline">New user</span>
        </summary>
        <div className="border-t border-line-2 bg-canvas/40 p-4">
          <UserForm user={null} isSelf={false} />
        </div>
      </details>
    </>
  );
}

type UserRow = { id: string; username: string; name: string | null; role: "ADMIN" | "USER"; isActive: boolean };

function UserForm({ user, isSelf }: { user: UserRow | null; isSelf: boolean }) {
  // Delete is its own form, so the two actions never share a submit. The save
  // button reaches back into the edit form by id — plain HTML, no nesting.
  const formId = user ? `user-${user.id}` : "user-new";

  return (
    <div className="max-w-3xl space-y-3.5">
      <form id={formId} action={saveUser} className="space-y-3.5">
        {user && <input type="hidden" name="id" value={user.id} />}

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>
              Username<span className="text-danger"> *</span>
            </span>
            <input
              name="username"
              className={inputClass}
              defaultValue={user?.username}
              required
              spellCheck={false}
              autoCapitalize="none"
              placeholder="sadiq"
            />
            <span className="mt-1 block text-[11px] text-ink-3">What they type to sign in. Lower case, no spaces.</span>
          </label>

          <label className="block">
            <span className={fieldLabel}>Full name</span>
            <input name="name" className={inputClass} defaultValue={user?.name ?? undefined} placeholder="Sadiq Ali" />
            <span className="mt-1 block text-[11px] text-ink-3">Optional — only so the list reads as people.</span>
          </label>
        </div>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>{user ? "New password" : "Password"}</span>
            <input
              name="password"
              type="password"
              className={inputClass}
              autoComplete="new-password"
              required={!user}
              placeholder={user ? "Leave blank to keep the current one" : `At least ${MIN_PASSWORD} characters`}
            />
            <span className="mt-1 block text-[11px] leading-snug text-ink-3">
              {user
                ? "Setting one signs this person out everywhere; they must use the new password."
                : `At least ${MIN_PASSWORD} characters. Tell them to change it once they are in.`}
            </span>
          </label>

          <label className="block">
            <span className={fieldLabel}>Role</span>
            <select name="role" className={inputClass} defaultValue={user?.role ?? "USER"}>
              <option value="USER">User — quotations, customers, companies</option>
              <option value="ADMIN">Administrator — all of that, and this page</option>
            </select>
            <span className="mt-1 block text-[11px] text-ink-3">Only an administrator can manage users.</span>
          </label>
        </div>

        <label className="flex items-center gap-2 pt-0.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={user ? user.isActive : true}
            className="h-3.5 w-3.5 accent-accent"
          />
          <span className="text-[12.5px] text-ink-2">
            Can sign in
            <span className="ml-1.5 text-ink-3">— clear this to lock the account without deleting it.</span>
          </span>
        </label>
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
        {user && !isSelf ? (
          <form action={deleteUser}>
            <input type="hidden" name="id" value={user.id} />
            <button className={btn.danger}>Delete user</button>
          </form>
        ) : (
          <span className="text-[11.5px] text-ink-3">{isSelf ? "This is the account you are signed in with." : ""}</span>
        )}
        <button form={formId} className={btn.primary}>
          {user ? "Save changes" : "Create user"}
        </button>
      </div>
    </div>
  );
}
