// next/font downloads these once at build time and self-hosts them, so the
// printed quotation looks identical on every machine — no Google request at
// runtime, no missing-font fallback on the client's PC.
//
// Each template picks a different family on purpose: that is half of what makes
// the designs feel like they came from different businesses.
import {
  IBM_Plex_Sans,
  Inter,
  Lora,
  Merriweather,
  Montserrat,
  Playfair_Display,
  Poppins,
  Source_Serif_4,
} from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });
export const sourceSerif = Source_Serif_4({ subsets: ["latin"] });
export const montserrat = Montserrat({ subsets: ["latin"] });
export const playfair = Playfair_Display({ subsets: ["latin"] });
export const lora = Lora({ subsets: ["latin"] });
export const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
export const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
export const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"] });
