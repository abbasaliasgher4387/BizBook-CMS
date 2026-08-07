"use client";

// The only place navigation is defined. Adding a module — Bills, then Ledger,
// then whatever follows — means adding one group to navFor() and nothing else:
// the sidebar, the active-item logic and the small-screen menu all read from it.
//
// On a wide screen the rail is 56px of icons and gets out of the way. Point at
// it and it opens to 224px *over* the page rather than pushing it, so nothing
// reflows and the table you were reading stays where it was. Pure CSS hover —
// no state, no toggle to remember, nothing to get stuck open.
//
// A phone gets the same list on the same principle — over the page, not shoving
// it down. See the drawer at the foot of this file.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logout } from "@/app/auth-actions";
import { BrandMark } from "@/components/ui";
import { APP_NAME } from "@/lib/app";
import type { SessionUser } from "@/lib/auth";

/* -------------------------------------------------------------------- icons */

// Drawn here rather than pulled from an icon package: nine glyphs do not earn a
// dependency. One line weight, one 24px box, so they sit on the same rhythm.
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="1.5" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" />
    </>
  ),
  sheet: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  sheetPlus: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M12 12.5v5M9.5 15h5" />
    </>
  ),
  people: (
    <>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20v-1a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v1" />
      <path d="M16.5 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 15.3A4 4 0 0 1 21 19v1" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
      <path d="M15 9h3a2 2 0 0 1 2 2v10" />
      <path d="M2.5 21h19" />
      <path d="M8 7.5h3M8 11.5h3M8 15.5h3" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 2.8V11c0 4.6-3.1 8.6-7.5 10-4.4-1.4-7.5-5.4-7.5-10V5.8Z" />
      <path d="M9.2 12.1l2 2 3.6-3.9" />
    </>
  ),
  signOut: (
    <>
      <path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
      <path d="M16 16.5 20.5 12 16 7.5" />
      <path d="M20.5 12H9.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
};

function Icon({ name, className = "h-[18px] w-[18px] shrink-0" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

/* --------------------------------------------------------------- navigation */

type Group = { label?: string; items: { href: string; label: string; icon: string }[] };

/** Hiding the Admin group is presentation, not protection — /users itself calls
    requireAdmin(), so typing the address gets a normal user nowhere. */
function navFor(role: SessionUser["role"]): Group[] {
  const groups: Group[] = [
    { items: [{ href: "/", label: "Dashboard", icon: "dashboard" }] },
    {
      label: "Quotations",
      items: [
        { href: "/quotations", label: "All quotations", icon: "sheet" },
        { href: "/quotations/new", label: "New quotation", icon: "sheetPlus" },
      ],
    },
    {
      label: "Records",
      // Products is hidden on purpose, not deleted: /products still works and a
      // quotation line can still pick a saved product. Put the entry back here
      // when the module is wanted in the sidebar again.
      items: [{ href: "/customers", label: "Customers", icon: "people" }],
    },
    {
      label: "Setup",
      items: [
        { href: "/companies", label: "Companies", icon: "building" },
        { href: "/templates", label: "Quotation designs", icon: "layout" },
      ],
    },
  ];

  if (role === "ADMIN") {
    groups.push({ label: "Admin", items: [{ href: "/users", label: "User management", icon: "shield" }] });
  }
  return groups;
}

/** The longest matching href wins, so /quotations/new does not also light up
    "All quotations", and /quotations/<id> still lights up "All quotations". */
function activeHref(nav: Group[], path: string): string {
  return (
    nav
      .flatMap((g) => g.items.map((i) => i.href))
      .filter((h) => (h === "/" ? path === "/" : path === h || path.startsWith(`${h}/`)))
      .sort((a, b) => b.length - a.length)[0] ?? ""
  );
}

/* Every horizontal measurement in the rail lands the glyph on the same centre
   line, 28px in — which is the middle of the 56px collapsed rail. Change one of
   these and the icons stop lining up as the rail opens. */
const ITEM = "flex h-9 items-center gap-3 rounded-[5px] px-[11px]";
/** Text is present in the DOM at all times, for screen readers and for search;
    collapsed it is simply clipped and faded, and it fades in a beat after the
    rail has started opening so it never smears across the animation. */
const HIDES = "whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-hover/rail:delay-100";

function Brand({ rail }: { rail: boolean }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 px-[14px]">
      <BrandMark />
      <span
        className={`text-[15px] font-semibold tracking-[-0.015em] text-white ${rail ? HIDES : "whitespace-nowrap"}`}
      >
        {APP_NAME}
      </span>
    </div>
  );
}

function NavList({ nav, path, rail }: { nav: Group[]; path: string; rail: boolean }) {
  const active = activeHref(nav, path);
  const hide = rail ? HIDES : "whitespace-nowrap";

  return (
    <nav className="px-2 pb-4 pt-3">
      {nav.map((group, i) => (
        <div key={group.label ?? "top"} className={i === 0 ? undefined : "mt-4"}>
          {group.label && (
            <p
              className={`mb-1 px-[11px] pt-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-rail-fg/55 ${hide}`}
            >
              {group.label}
            </p>
          )}
          <ul className="space-y-px">
            {group.items.map((item) => {
              const on = item.href === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    className={`${ITEM} relative text-[13px] transition-colors ${
                      on
                        ? "bg-rail-hover font-medium text-white"
                        : "text-rail-fg hover:bg-rail-hover/60 hover:text-white"
                    }`}
                  >
                    {on && (
                      <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent-bright" />
                    )}
                    <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${on ? "text-accent-bright" : ""}`} />
                    <span className={hide}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Who is signed in, and the two things they can do about it. Sits at the foot
    of the rail because it is the last thing anyone needs, not the first. */
function AccountFooter({ user, path, rail }: { user: SessionUser; path: string; rail: boolean }) {
  const on = path === "/account";
  const hide = rail ? HIDES : "whitespace-nowrap";

  return (
    <div className="shrink-0 border-t border-rail-line px-2 py-2">
      <Link
        href="/account"
        aria-current={on ? "page" : undefined}
        className={`flex items-center gap-3 rounded-[5px] px-1.5 py-1.5 transition-colors ${
          on ? "bg-rail-hover" : "hover:bg-rail-hover/60"
        }`}
      >
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rail-hover text-[10.5px] font-semibold uppercase text-rail-fg"
        >
          {user.username.slice(0, 2)}
        </span>
        <span className={`min-w-0 leading-tight ${hide}`}>
          <span className="block truncate text-[12.5px] font-medium text-white">{user.name ?? user.username}</span>
          <span className="block truncate text-[10.5px] text-rail-fg">
            {user.role === "ADMIN" ? "Administrator" : "User"}
          </span>
        </span>
      </Link>

      <form action={logout}>
        <button
          className={`${ITEM} mt-px w-full text-[12.5px] text-rail-fg transition-colors hover:bg-rail-hover/60 hover:text-white`}
        >
          <Icon name="signOut" />
          <span className={hide}>Sign out</span>
        </button>
      </form>
    </div>
  );
}

export default function SideNav({ user }: { user: SessionUser }) {
  const path = usePathname();
  const nav = navFor(user.role);
  const drawer = useRef<HTMLDialogElement>(null);

  // Tapping a link routes the page *behind* the drawer, and nothing else would
  // shut it, so the route change does. Runs harmlessly on a closed dialog.
  useEffect(() => {
    drawer.current?.close();
  }, [path]);

  return (
    <>
      <aside className="group/rail no-print fixed inset-y-0 left-0 z-30 hidden w-14 flex-col overflow-x-hidden overflow-y-auto bg-rail transition-[width] duration-200 ease-out hover:w-56 lg:flex">
        <div className="shrink-0 border-b border-rail-line">
          <Brand rail />
        </div>
        <div className="flex-1">
          <NavList nav={nav} path={path} rail />
        </div>
        <AccountFooter user={user} path={path} rail />
      </aside>

      {/* Small screens: a bar that stays put, and the same list in a drawer over
          the page. This used to be a <details> that opened in the flow and
          pushed everything down — on a phone that shoved the thing you were
          reading off the bottom of the screen, and the list itself was taller
          than the viewport.

          The bar is sticky so the menu is one tap away however far down the
          quotation you have scrolled. */}
      <div className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rail-line bg-rail pr-2 lg:hidden">
        <Brand rail={false} />
        <button
          type="button"
          onClick={() => drawer.current?.showModal()}
          className="flex h-10 items-center gap-2 rounded-[5px] px-2.5 text-[12.5px] font-medium text-rail-fg transition-colors hover:bg-rail-hover hover:text-white"
        >
          <Icon name="menu" />
          Menu
        </button>
      </div>

      {/* A real <dialog>: the backdrop, Esc-to-close, the focus trap and the
          inert page behind it are the browser's job, not ours. Clicking the
          backdrop lands on the dialog itself — the panel inside fills it — which
          is how dismissing by tapping away is one line. */}
      <dialog
        ref={drawer}
        aria-label="Navigation"
        className="drawer no-print"
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-rail-line pr-2">
            <Brand rail={false} />
            <button
              type="button"
              onClick={() => drawer.current?.close()}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-[5px] text-rail-fg transition-colors hover:bg-rail-hover hover:text-white"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavList nav={nav} path={path} rail={false} />
          </div>
          <AccountFooter user={user} path={path} rail={false} />
        </div>
      </dialog>
    </>
  );
}
