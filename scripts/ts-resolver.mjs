import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Lets Node run the app's TypeScript directly with `--experimental-strip-types`
 * by resolving the extensionless and directory imports that the bundler
 * normally handles. Development-only: nothing ships with this.
 */
export async function resolve(specifier, context, next) {
  const isExtensionless = !/\.[cm]?[jt]sx?$/.test(specifier);
  const base =
    specifier.startsWith("@/")
      ? new URL(`../${specifier.slice(2)}`, import.meta.url).href
      : specifier.startsWith(".") && isExtensionless
        ? new URL(specifier, context.parentURL).href
        : null;

  if (base) {
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
      if (existsSync(fileURLToPath(candidate))) {
        return next(candidate, context);
      }
    }
  }
  return next(specifier, context);
}
