import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Lets Node run the app's TypeScript directly with `--experimental-strip-types`
 * by resolving the extensionless and directory imports that the bundler
 * normally handles. Development-only: nothing ships with this.
 */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    const base = new URL(specifier, context.parentURL).href;
    for (const candidate of [`${base}.ts`, `${base}/index.ts`]) {
      if (existsSync(fileURLToPath(candidate))) {
        return next(candidate, context);
      }
    }
  }
  return next(specifier, context);
}
