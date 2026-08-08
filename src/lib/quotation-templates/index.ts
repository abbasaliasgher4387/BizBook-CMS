// The design registry. A company stores one of these keys in `templateKey`, and
// that decides how its documents print — its quotations and its bills both, on
// the same sheet; see docWords() in shared.ts for the handful of words that
// differ between them. Every entry is copied from a letterhead the client
// actually supplied — a company with no letterhead gets no design. Adding one
// means one new file next to this one and one line in TEMPLATES.
import AlBurhan from "./alburhan";
import AlMufaddal from "./almufaddal";
import Bizway from "./bizway";
import Mbis from "./mbis";
import Mistry from "./mistry";
import Sams from "./sams";
import Taheri from "./taheri";
import type { TemplateProps } from "./types";

type Entry = {
  /** Shown in the picker and the gallery. */
  label: string;
  /** One line on what makes this design different. */
  note: string;
  /** This design's own letterhead colour, lifted from the component below. The
      app prints it beside every document number, so a row is recognised on
      screen by the same colour it comes out of the printer in. */
  swatch: string;
  Component: (props: TemplateProps) => React.JSX.Element;
};

export const TEMPLATES = {
  sams: {
    label: "SAMS Traders",
    note: "Maroon and gold serif letterhead, mark on the left, trade lines on the right, ruled address footer.",
    swatch: "#7B1E2B",
    Component: Sams,
  },
  bizway: {
    label: "Bizway Enterprise",
    note: "Fully centred, green blocks, zebra table, centred address footer.",
    swatch: "#4E9A2F",
    Component: Bizway,
  },
  mistry: {
    label: "Mistry Steel",
    note: "Royal blue, everything flush left, totals on the left, stacked NTN and STRN footer.",
    swatch: "#1F3D8F",
    Component: Mistry,
  },
  taheri: {
    label: "Taheri Supply Agency",
    note: "Brown and gold shield, centred serif, Qty as the first column, sign-off at bottom left.",
    swatch: "#5B2318",
    Component: Taheri,
  },
  almufaddal: {
    label: "Al Mufaddal Enterprises",
    note: "Blue diamond mark, stacked Name and Address rows, totals end in G-Total Amount.",
    swatch: "#1B7FD0",
    Component: AlMufaddal,
  },
  alburhan: {
    label: "Al Burhan Trading Co.",
    note: "Teal and navy small caps, two ruled panels, full ledger grid, NTN and GST footer.",
    swatch: "#17325C",
    Component: AlBurhan,
  },
  mbis: {
    label: "M.B. Industrial Solution",
    note: "Teal angled bands top and bottom, logo beside the name, left-aligned body, contact band footer.",
    swatch: "#1B7C8C",
    Component: Mbis,
  },
} satisfies Record<string, Entry>;

export type TemplateKey = keyof typeof TEMPLATES;

export const TEMPLATE_KEYS = Object.keys(TEMPLATES) as TemplateKey[];

export const DEFAULT_TEMPLATE: TemplateKey = "sams";

/** Falls back to the default so an unknown key in the database never 500s. */
export function templateFor(key: string): (typeof TEMPLATES)[TemplateKey] {
  return TEMPLATES[key as TemplateKey] ?? TEMPLATES[DEFAULT_TEMPLATE];
}

/** The letterhead colour for a company's design. */
export function swatchFor(key: string): string {
  return templateFor(key).swatch;
}
