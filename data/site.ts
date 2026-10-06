/** The project's name and home, in one place so a rename is one edit. */
export const NAME = "System Map";
export const REPO = "https://github.com/nichtlegacy/system-map";

/**
 * A file under `public/`, as the browser has to ask for it. Next.js prefixes
 * its own links and scripts with the base path; a plain `<img src>` it does
 * not, so every public asset goes through here.
 */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

/**
 * The social preview, for pages that set their own `openGraph`: Next.js only
 * applies app/opengraph-image.png to routes that leave `openGraph` alone.
 */
export const OG_IMAGE = {
  url: asset("/opengraph-image.png"),
  width: 1200,
  height: 630,
  alt: "The System Map mark and the words “Draw systems people can follow.” beside a section of the example map.",
};
