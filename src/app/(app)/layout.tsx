import SideNav from "@/components/side-nav";
import { requireUser } from "@/lib/auth";

/**
 * Everything the office actually uses sits inside this group, so this one line
 * is the whole authorisation story: no page below here renders for a browser
 * without a valid session, whatever the proxy did or did not catch.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      {/* The sidebar is .no-print, so Ctrl+P on a quotation yields the sheet
          alone — which is why the offset below is reset for print too.

          The offset matches the rail *collapsed*, not opened: pointing at the
          rail must not shove the page sideways, so it opens over the top. */}
      <SideNav user={user} />
      <div className="app-shell lg:pl-14">
        <main className="app-main mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-5 sm:py-6">{children}</main>
      </div>
    </>
  );
}
