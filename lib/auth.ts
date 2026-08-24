import { betterAuth } from "better-auth";
import { Pool } from "pg";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

const baseURL = requiredEnv("BETTER_AUTH_URL");
const trustedOrigins = Array.from(
  new Set(
    [
      new URL(baseURL).origin,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ].filter(Boolean),
  ),
);
const globalForAuth = globalThis as typeof globalThis & {
  arthamAuthPool?: Pool;
};

const pool =
  globalForAuth.arthamAuthPool ??
  new Pool({
    connectionString: requiredEnv("AUTH_DATABASE_URL"),
    ssl:
      process.env.AUTH_DATABASE_SSL === "true"
        ? { rejectUnauthorized: true }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.arthamAuthPool = pool;
}

export const auth = betterAuth({
  appName: "Artham",
  baseURL,
  secret: requiredEnv("BETTER_AUTH_SECRET"),
  database: pool,
  socialProviders: {
    google: {
      clientId: requiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
      prompt: "select_account",
    },
  },
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      joins: true,
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
