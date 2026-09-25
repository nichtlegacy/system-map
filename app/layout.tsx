import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { asset, NAME } from "@/data/site";

import "./globals.css";

const title = NAME;
const description =
  "Hand-placed system maps for React Flow and Next.js: typed data, cards that say what they are, labelled wires, and PNG or SVG export in either theme.";

export const metadata: Metadata = {
  // The origin, without a path: Next.js adds the base path to its own image
  // URLs, and asset() adds it to the canonical ones below. Set
  // NEXT_PUBLIC_SITE_URL at build time wherever the app is served.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${title} — draw systems people can follow`, template: `%s · ${title}` },
  description,
  applicationName: title,
  authors: [{ name: "nichtlegacy", url: "https://github.com/nichtlegacy" }],
  creator: "nichtlegacy",
  keywords: ["system map", "architecture diagram", "React Flow", "xyflow", "Next.js"],
  robots: { index: true, follow: true },
  alternates: { canonical: asset("/") },
  // The image itself comes from app/opengraph-image.png and its .alt.txt,
  // which Next.js applies to every route, including the twitter card.
  openGraph: {
    type: "website",
    siteName: title,
    locale: "en_US",
    url: asset("/"),
    title: `${title} — draw systems people can follow`,
    description,
  },
  twitter: { card: "summary_large_image", title: `${title} — draw systems people can follow`, description },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

const themeScript = `try{var t=localStorage.getItem("theme");document.documentElement.classList.add("theme-"+(t==="light"?"light":"dark"))}catch(e){document.documentElement.classList.add("theme-dark")}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
