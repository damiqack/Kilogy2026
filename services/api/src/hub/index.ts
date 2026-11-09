import { IntegrationHub, type HubOptions } from "./hub";
import { PROVIDERS } from "./providers";
import { ProviderRegistry } from "./registry";
import type { ProviderDefinition } from "./define";

export { IntegrationHub } from "./hub";
export { ProviderRegistry } from "./registry";
export { defineProvider } from "./define";
export { createHubRouter } from "./router";
export * from "./types";

/** Builds the hub with every provider in providers/index.ts (or the list given, for tests). */
export function createHub(opts: HubOptions & { providers?: ProviderDefinition[] } = {}) {
  const env = opts.env ?? process.env;
  const registry = new ProviderRegistry();
  for (const p of opts.providers ?? PROVIDERS) registry.register(p.connect(env));
  return new IntegrationHub(registry, { ...opts, env });
}
