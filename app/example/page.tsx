import type { Metadata } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { Chain } from "@/components/shell/Chain";
import type { LegendItem } from "@/components/shell/AppFooter";
import { counts } from "@/data/example/counts";
import { asset, OG_IMAGE } from "@/data/site";

import { ExampleMap } from "./ExampleMap";

const description =
  "A fictional request flow drawn with every card kind in System Map. Pan, zoom, filter the wires, and export the whole canvas as PNG or SVG.";

export const metadata: Metadata = {
  title: "Example",
  description,
  alternates: { canonical: asset("/example") },
  // Pages set openGraph wholesale, so the shared fields are repeated here.
  openGraph: {
    type: "website",
    siteName: "System Map",
    locale: "en_US",
    url: asset("/example"),
    title: "Example map · System Map",
    description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Example map · System Map",
    description,
    images: [OG_IMAGE],
  },
};

const legend: LegendItem[] = [
  { label: "Data", flavor: "data", count: counts.byFlavor.data },
  { label: "Control", flavor: "management", count: counts.byFlavor.management },
  { label: "External", flavor: "external", count: counts.byFlavor.external },
];

export default function ExamplePage() {
  return (
    <AppShell
      legend={legend}
      footer={<Chain items={["entry", "edge", "processing", "core", "storage"]} step label="Flow" />}
    >
      <ExampleMap />
    </AppShell>
  );
}
