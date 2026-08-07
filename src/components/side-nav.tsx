"use client";

// The only place navigation is defined. Adding a module — Bills, then Ledger,
// then whatever follows — means adding one group to NAV and nothing else: the
// sidebar, the active-item logic and the small-screen menu all read from it.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/app";

type Group = { label?: string; items: { href: string; label: string }[] };

const NAV: Group[] = [
  { items: [{ href: "/", label: "Dashboard" }] },
  {
    label: "Quotations",
    items: [
      { href: "/quotations", label: "All quotations" },
      { href: "/quotations/new", label: "New quotation" },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/customers", label: "Customers" },
      { href: "/products", label: "Products" },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/companies", label: "Companies" },
      { href: "/templates", label: "Quotation designs" },
    ],
  },
];

const HREFS = NAV.flatMap((g) => g.items.map((i) => i.href));

/** The longest matching href wins, so /quotations/new does not also light up
    "All quotations", and /quotations/<id> still lights up "All quotations". */
function activeHref(path: string): string {
  return (
    HREFS.filter((h) => (h === "/" ? path === "/" : path === h || path.startsWith(`${h}/`))).sort(
      (a, b) => b.length - a.length,
    )[0] ?? ""
  );
}

function Brand() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
      {/* A ruled sheet — the thing this software exists to produce. */}
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 flex-col justify-center gap-[3px] rounded-[5px] border border-rail-line px-[5px]"
      >
        <i className="h-[2px] rounded-full bg-accent-bright" />
        <i className="h-[2px] w-3/4 rounded-full bg-rail-fg" />
        <i className="h-[2px] w-1/2 rounded-full bg-rail-fg/50" />
      </span>
      <span className="leading-tight">
        <span className="block text-[13.5px] font-semibold tracking-tight text-white">{APP_NAME}</span>
        <span className="block text-[10.5px] text-rail-fg">{APP_TAGLINE}</span>
      </span>
    </div>
  );
}

function NavList({ path }: { path: string }) {
  const active = activeHref(path);

  return (
    <nav className="px-2.5 pb-4 pt-3">
      {NAV.map((group, i) => (
        <div key={group.label ?? "top"} className={i === 0 ? undefined : "mt-5"}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-rail-fg/60">
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
                    className={`relative flex h-8 items-center rounded-[5px] pl-3 pr-2 text-[13px] transition-colors ${
                      on
                        ? "bg-rail-hover font-medium text-white"
                        : "text-rail-fg hover:bg-rail-hover/60 hover:text-white"
                    }`}
                  >
                    {on && (
                      <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent-bright" />
                    )}
                    {item.label}
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

export default function SideNav() {
  const path = usePathname();

  return (
    <>
      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-56 flex-col overflow-y-auto bg-rail lg:flex">
        <div className="border-b border-rail-line">
          <Brand />
        </div>
        <NavList path={path} />
      </aside>

      {/* Small screens get the same list behind a disclosure — no JavaScript,
          no second copy of NAV. */}
      <details className="no-print border-b border-rail-line bg-rail lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between pr-4 [&::-webkit-details-marker]:hidden">
          <Brand />
          <span className="text-[12px] font-medium text-rail-fg">Menu</span>
        </summary>
        <NavList path={path} />
      </details>
    </>
  );
}
