import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Big_Shoulders } from "next/font/google";
import { Providers } from "@/shared/components/providers";
import "./globals.css";

// docs/DISENO.md §2 — Big Shoulders (antes "Big Shoulders Display") no trae itálica:
// la clase .titular-momento la inclina con font-synthesis del navegador.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
});
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "chilena", template: "%s · chilena" },
  description: "Del llano a tu celular. La red social del fútbol llanero.",
  applicationName: "chilena",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07090c" },
    { media: "(prefers-color-scheme: light)", color: "#f4f7fa" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      suppressHydrationWarning
      className={`${bigShoulders.variable} ${barlow.variable} ${barlowCondensed.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
