import { ApiError } from "../lib/errors";
import { fromDcsa, isContainerNumber, type DcsaEvent } from "./normalize";
import type { CallContext, HubTrackingEvent, WebhookInput } from "./types";

export type DcsaAuth =
  /** A static key sent in a header, e.g. Maersk's Consumer-Key. */
  | { kind: "header"; header: string; keyVar: string }
  /** OAuth 2.0 client credentials, exchanged for a bearer token and cached until it expires. */
  | { kind: "oauth"; tokenUrlVar: string; clientIdVar: string; clientSecretVar: string };

export interface DcsaOptions {
  providerId: string;
  /** Environment variable holding the carrier's DCSA Track & Trace base URL. */
  baseUrlVar: string;
  auth: DcsaAuth;
}

/**
 * Shared live tracking for ocean carriers that publish the DCSA Track & Trace standard.
 * One implementation, configured per carrier, instead of six bespoke ones.
 */
export function dcsaTracking(env: Record<string, string | undefined>, o: DcsaOptions) {
  let token: { value: string; expires: number } | null = null;

  async function authHeaders(ctx: CallContext): Promise<Record<string, string>> {
    const a = o.auth;
    if (a.kind === "header") return { [a.header]: env[a.keyVar] ?? "" };
    if (!token || token.expires < Date.now() + 30_000) {
      const res = await ctx.fetch(env[a.tokenUrlVar] ?? "", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: env[a.clientIdVar] ?? "", client_secret: env[a.clientSecretVar] ?? "" }),
        signal: ctx.signal,
      });
      if (!res.ok) throw new ApiError(502, "provider_auth_failed", `${o.providerId} token request returned HTTP ${res.status}`);
      const body = (await res.json()) as { access_token: string; expires_in?: number };
      token = { value: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 };
    }
    return { Authorization: `Bearer ${token.value}` };
  }

  return {
    async track(ref: string, ctx: CallContext): Promise<HubTrackingEvent[]> {
      const base = (env[o.baseUrlVar] ?? "").replace(/\/$/, "");
      const param = isContainerNumber(ref) ? "equipmentReference" : "carrierBookingReference";
      const res = await ctx.fetch(`${base}/events?${param}=${encodeURIComponent(ref)}`, {
        headers: { Accept: "application/json", ...(await authHeaders(ctx)) },
        signal: ctx.signal,
      });
      if (res.status === 404) return [];
      if (!res.ok) throw new ApiError(502, "provider_error", `${o.providerId} tracking returned HTTP ${res.status}`);
      const body = (await res.json()) as DcsaEvent[] | { events?: DcsaEvent[] };
      return fromDcsa(o.providerId, ref, Array.isArray(body) ? body : body.events ?? []);
    },
    /** DCSA event subscriptions push the same event objects, one or many per call. */
    async parseWebhook(input: WebhookInput): Promise<HubTrackingEvent[]> {
      const body = input.body as DcsaEvent | DcsaEvent[];
      const list = Array.isArray(body) ? body : [body];
      return fromDcsa(o.providerId, "", list.filter((e) => e && typeof e === "object" && "eventType" in e));
    },
  };
}
