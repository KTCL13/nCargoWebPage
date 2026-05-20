import { League_Spartan, Poppins, Montserrat } from "next/font/google";

export const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-titles",
  weight: ["700"],
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-subtitles",
  weight: ["500", "600"],
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"],
  display: "swap",
});
