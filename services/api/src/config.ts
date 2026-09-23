import dotenv from "dotenv";
import path from "path";

// Load only this project's .env (repo root), never a parent or global one.
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });

export const config = {
  port: Number(process.env.API_PORT ?? 4100),
  aiEngineUrl: process.env.AI_ENGINE_URL ?? "http://localhost:4200",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-kilogy2026-dev-only",
  jwtExpirySeconds: Number(process.env.JWT_EXPIRY_SECONDS ?? 900),
  devApiKey: process.env.DEV_API_KEY ?? "kg_test_dev_key_123",
  quoteCacheTtlSeconds: Number(process.env.QUOTE_CACHE_TTL_SECONDS ?? 900),
  quoteValiditySeconds: 60 * 60 * 24,
};

export type Tier = "free" | "pro" | "enterprise";

/** Requests per hour, per architecture section 2.1. Enterprise is set per account. */
export const TIER_LIMITS: Record<Tier, number> = {
  free: 100,
  pro: 10_000,
  enterprise: 100_000,
};
