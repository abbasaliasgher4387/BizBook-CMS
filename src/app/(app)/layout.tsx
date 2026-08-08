import SideNav from "@/components/side-nav";
import { requireUser } from "@/lib/auth";

/** This one line is the whole authorisation story: nothing below this group
    renders without a valid session, whatever the proxy did or did not catch. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      {/* The left offset matches the rail *collapsed*: pointing at it must not
          shove the page sideways. Both offsets are reset for print in
          globals.css, or every PDF comes out shifted. */}
      <SideNav user={user} />
      <div className="app-shell pt-14 lg:pl-14">
        <main className="app-main mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-5 sm:py-6">{children}</main>
      </div>
    </>
  );
}
