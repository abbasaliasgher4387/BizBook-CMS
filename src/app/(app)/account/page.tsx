// Your own account. Everyone gets this page, admin or not — an admin can reset
// anybody's password from User management, but nobody should have to ask them
// in order to change their own.
import { changeMyPassword } from "@/app/auth-actions";
import { Card, PageHeader, btn, fieldLabel, inputClass } from "@/components/ui";
import { MAX_PASSWORD, MIN_PASSWORD, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  wrong: "That is not your current password.",
  short: `The new password must be at least ${MIN_PASSWORD} characters long.`,
  long: `The new password must be at most ${MAX_PASSWORD} characters long.`,
  same: "The new password is the same as the current one.",
};

export default async function AccountPage(props: PageProps<"/account">) {
  const me = await requireUser();
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;
  const changed = "changed" in sp;

  return (
    <>
      <PageHeader title="My account" subtitle="The account this browser is signed in with." />

      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <Card title="Account">
          <dl className="space-y-2.5 text-[13px]">
            <Row label="Username" value={me.username} />
            <Row label="Name" value={me.name ?? "—"} />
            <Row label="Role" value={me.role === "ADMIN" ? "Administrator" : "User"} />
          </dl>
          <p className="mt-3.5 border-t border-line-2 pt-3 text-[11.5px] leading-relaxed text-ink-3">
            {me.role === "ADMIN"
              ? "As an administrator you can change your own username and name from User management."
              : "Ask an administrator to change your username or name."}
          </p>
        </Card>

        <Card title="Change password">
          {error && (
            <p
              role="alert"
              className="mb-3.5 rounded-[5px] border border-danger/25 bg-red-50 px-3 py-2 text-[12.5px] text-danger"
            >
              {error}
            </p>
          )}
          {changed && (
            <p className="mb-3.5 rounded-[5px] border border-accent/25 bg-accent-soft px-3 py-2 text-[12.5px] text-accent">
              Password changed. Any other browser you were signed in on has been signed out.
            </p>
          )}

          <form action={changeMyPassword} className="space-y-3">
            <label className="block">
              <span className={fieldLabel}>Current password</span>
              <input
                name="currentPassword"
                type="password"
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>New password</span>
              <input
                name="newPassword"
                type="password"
                className={inputClass}
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD}
                placeholder={`At least ${MIN_PASSWORD} characters`}
              />
            </label>
            <button className={`${btn.primary} w-full`}>Change password</button>
          </form>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
