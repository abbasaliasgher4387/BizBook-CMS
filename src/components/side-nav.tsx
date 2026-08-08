"use client";

// The only place navigation is defined: a new module means one new group in
// navFor() and nothing else. The rail, the drawer and the active-item logic all
// read from it.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logout } from "@/app/auth-actions";
import { BrandMark } from "@/components/ui";
import { APP_NAME } from "@/lib/app";
import type { SessionUser } from "@/lib/auth";

/* -------------------------------------------------------------------- icons */

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
  receipt: (
    <>
      <path d="M5 21V4.5a1 1 0 0 1 1.5-.87L9 5l2.5-1.4a1 1 0 0 1 1 0L15 5l2.5-1.37A1 1 0 0 1 19 4.5V21l-2.5-1.4a1 1 0 0 0-1 0L13 21l-2.5-1.4a1 1 0 0 0-1 0Z" />
      <path d="M9 9.5h6M9 13.5h4" />
    </>
  ),
  receiptPlus: (
    <>
      <path d="M5 21V4.5a1 1 0 0 1 1.5-.87L9 5l2.5-1.4a1 1 0 0 1 1 0L15 5l2.5-1.37A1 1 0 0 1 19 4.5V21l-2.5-1.4a1 1 0 0 0-1 0L13 21l-2.5-1.4a1 1 0 0 0-1 0Z" />
      <path d="M12 9.5v5M9.5 12h5" />
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
      label: "Bills",
      items: [
        { href: "/bills", label: "All bills", icon: "receipt" },
        { href: "/bills/new", label: "New bill", icon: "receiptPlus" },
      ],
    },
    {
      label: "Records",
      // Products is hidden, not deleted: /products still works and a quotation
      // line can still pick a saved product.
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

/** Longest matching href wins, so /quotations/new does not also light up
    "All quotations". */
function activeHref(nav: Group[], path: string): string {
  return (
    nav
      .flatMap((g) => g.items.map((i) => i.href))
      .filter((h) => (h === "/" ? path === "/" : path === h || path.startsWith(`${h}/`)))
      .sort((a, b) => b.length - a.length)[0] ?? ""
  );
}

/* Lands every glyph 28px in — the middle of the collapsed 56px rail. Change
   these and the icons stop lining up as it opens. */
const ITEM = "flex h-9 items-center gap-3 rounded-[5px] px-[11px]";
/** The text stays in the DOM for screen readers; collapsed it is only clipped
    and faded. */
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

// Deliberately NOT navigation: links live in the rail and the drawer and
// nowhere else. Put module links up here and this becomes the horizontal
// top-nav that was rejected on purpose.
function TopBar({ user, path, onMenu }: { user: SessionUser; path: string; onMenu: () => void }) {
  const onAccount = path === "/account";

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-1 border-b border-rail-line bg-rail pl-1 pr-2 sm:pr-3">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] text-rail-fg transition-colors hover:bg-rail-hover hover:text-white lg:hidden"
      >
        <Icon name="menu" />
      </button>

      <Brand rail={false} />

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <Link
          href="/account"
          aria-current={onAccount ? "page" : undefined}
          className={`flex h-10 items-center gap-2 rounded-[5px] px-1.5 transition-colors ${
            onAccount ? "bg-rail-hover" : "hover:bg-rail-hover/60"
          }`}
        >
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rail-line text-[10.5px] font-semibold uppercase text-rail-fg"
          >
            {user.username.slice(0, 2)}
          </span>
          <span className="hidden min-w-0 leading-tight md:block">
            <span className="block truncate text-[12.5px] font-medium text-white">{user.name ?? user.username}</span>
            <span className="block truncate text-[10.5px] text-rail-fg">
              {user.role === "ADMIN" ? "Administrator" : "User"}
            </span>
          </span>
        </Link>

        <form action={logout}>
          <button
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-[5px] text-rail-fg transition-colors hover:bg-rail-hover hover:text-white"
          >
            <Icon name="signOut" />
          </button>
        </form>
      </div>
    </header>
  );
}

export default function SideNav({ user }: { user: SessionUser }) {
  const path = usePathname();
  const nav = navFor(user.role);
  const drawer = useRef<HTMLDialogElement>(null);

  // Nothing else would shut the drawer after a tap, so the route change does.
  useEffect(() => {
    drawer.current?.close();
  }, [path]);

  return (
    <>
      <TopBar user={user} path={path} onMenu={() => drawer.current?.showModal()} />

      <aside className="group/rail no-print fixed bottom-0 left-0 top-14 z-30 hidden w-14 flex-col overflow-x-hidden overflow-y-auto bg-rail transition-[width] duration-200 ease-out hover:w-56 lg:flex">
        <NavList nav={nav} path={path} rail />
      </aside>

      {/* A real <dialog>, so the backdrop, Esc-to-close and the focus trap are
          the browser's job. */}
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
        </div>
      </dialog>
    </>
  );
}
