// The one screen outside the app frame: no sidebar, no navigation.
import { login } from "@/app/auth-actions";
import { BrandMark, btn, fieldLabel, inputClass } from "@/components/ui";
import { APP_NAME } from "@/lib/app";
import { ensureAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: PageProps<"/login">) {
  // A fresh database has nothing to sign in with, so the account the client was
  // given is created on the first visit here.
  await ensureAdmin();

  const error = (await props.searchParams).error;
  const failed = error !== undefined;
  const locked = error === "locked";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-rail px-4 py-10">
      <div className="w-full max-w-[21rem]">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-3.5 inline-flex rounded-[10px] border border-rail-line bg-rail-hover p-3">
            <BrandMark className="h-7 w-7" />
          </span>
          <h1 className="text-[22px] font-semibold leading-none tracking-[-0.02em] text-white">{APP_NAME}</h1>
          <p className="mt-2 text-[12.5px] text-rail-fg">Sign in to continue</p>
        </div>

        <form action={login} className="rounded-md bg-paper p-6">
          {failed && (
            <p
              role="alert"
              className="mb-4 rounded-[5px] border border-danger/25 bg-red-50 px-3 py-2 text-[12.5px] text-danger"
            >
              {locked
                ? "Too many attempts. Try again in fifteen minutes."
                : "That username and password do not match an active account."}
            </p>
          )}

          <label className="block">
            <span className={fieldLabel}>Username</span>
            <input
              name="username"
              className={inputClass}
              autoComplete="username"
              autoFocus
              required
              spellCheck={false}
              autoCapitalize="none"
            />
          </label>

          <label className="mt-3 block">
            <span className={fieldLabel}>Password</span>
            <input name="password" type="password" className={inputClass} autoComplete="current-password" required />
          </label>

          <button className={`${btn.primary} mt-5 w-full`}>Sign in</button>
        </form>
      </div>
    </div>
  );
}
