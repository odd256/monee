import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { injectManifest } from "@serwist/build";

const OUT_DIR = "out";
const BUNDLE = path.join(OUT_DIR, "sw-bundle.js");
const SW = path.join(OUT_DIR, "sw.js");

try {
  await fs.access(OUT_DIR);
} catch {
  console.error("out/ does not exist. Run `next build` first.");
  process.exit(1);
}

await build({
  entryPoints: ["lib/pwa/sw.ts"],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: BUNDLE,
  minify: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

const result = await injectManifest({
  swSrc: BUNDLE,
  swDest: SW,
  globDirectory: OUT_DIR,
  globPatterns: ["**/*.{html,js,css,svg,png,ico,webmanifest,woff2,txt}"],
  globIgnores: ["sw.js", "sw-bundle.js", "**/*.map"],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  injectionPoint: "self.__SW_MANIFEST",
});

await fs.unlink(BUNDLE);

console.log(
  `Service worker generated: ${result.count} files, ${(result.size / 1024).toFixed(1)} KiB`,
);
