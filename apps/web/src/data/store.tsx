import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hubName } from "./carriers";
import { seedAlerts, seedDocuments, seedPayments, seedShipments, trackingId } from "./seed";
import type { AiAlert, DocumentRecord, Payment, Quote, RankedOption, Shipment, TimelineStep } from "./types";

/**
 * Client-side store for the prototype. Stands in for the Shipment, Document and Payment services
 * until services/api is running. Saved to localStorage so bookings survive a reload.
 */
interface State {
  shipments: Shipment[];
  documents: DocumentRecord[];
  payments: Payment[];
  quotes: Quote[];
  alerts: AiAlert[];
}

interface Store extends State {
  saveQuote: (q: Quote) => void;
  book: (quote: Quote, option: RankedOption, extra?: Pick<Shipment, "street" | "commodity">) => Shipment;
  dismissAlert: (id: string) => void;
  cancel: (id: string) => void;
  generateDocument: (shipmentId: string, type: DocumentRecord["type"]) => DocumentRecord;
  reset: () => void;
}

const KEY = "kilogy2026.web.state.v2";
const StoreCtx = createContext<Store | null>(null);

function initial(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.shipments?.every((x) => Array.isArray(x.timeline))) return { ...fresh(), ...parsed };
    }
  } catch {
    /* storage unavailable */
  }
  return fresh();
}

function fresh(): State {
  return { shipments: seedShipments(), documents: seedDocuments(), payments: seedPayments(), quotes: [], alerts: seedAlerts() };
}

/** Planned milestones for a new booking, built from the chosen route's legs. */
function plannedTimeline(option: RankedOption, originCity: string, destCity: string, now: number): TimelineStep[] {
  const legs = option.route?.legs ?? [];
  const hubs = legs.slice(1).map((l) => l.from);
  const total = option.transit_days * 864e5;
  const steps: [string, string][] = [
    ["Pickup scheduled", `${originCity} Depot`],
    ...hubs.map((h, i): [string, string] => [i === 0 ? "Departs" : "In transit", hubName(h)]),
    ["Arriving", hubName(legs[legs.length - 1]?.from ?? destCity)],
    ["Final delivery", destCity],
  ];
  return [
    { title: "Shipment booked", location: originCity, time: new Date(now).toISOString(), state: "current" },
    ...steps.map(([title, location], i) => ({
      title, location, state: "upcoming" as const,
      time: new Date(now + (total * (i + 1)) / (steps.length + 1) + 6 * 36e5).toISOString(),
    })),
  ];
}

const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const store = useMemo<Store>(() => ({
    ...state,
    saveQuote: (q) => setState((s) => ({ ...s, quotes: [q, ...s.quotes].slice(0, 20) })),
    book: (quote, option, extra) => {
      const nowMs = Date.now();
      const now = new Date(nowMs).toISOString();
      const today = now.slice(0, 10);
      const seq = state.shipments.filter((x) => x.createdAt.slice(0, 10) === today).length + 101;
      const o = quote.request.origin, d = quote.request.destination;
      const shipment: Shipment = {
        id: rid("shp"),
        trackingId: trackingId(now, seq),
        createdAt: now,
        status: "booked",
        origin: o,
        destination: d,
        package: quote.request.package,
        selected: option,
        carrierTracking: `${option.carrier_id.toUpperCase()}${Math.floor(1e9 + Math.random() * 9e9)}`,
        timeline: plannedTimeline(option, o.city ?? o.country, d.city ?? d.country, nowMs),
        ...extra,
      };
      const payment: Payment = { id: rid("pay"), shipmentId: shipment.id, amount_usd: option.price_usd, status: "succeeded", method: "Visa •••• 4242", createdAt: now };
      const label: DocumentRecord = { id: rid("doc"), type: "label", shipmentId: shipment.id, filename: `label-${shipment.trackingId}.pdf`, createdAt: now };
      setState((s) => ({
        ...s,
        shipments: [shipment, ...s.shipments],
        payments: [payment, ...s.payments],
        documents: [label, ...s.documents],
      }));
      return shipment;
    },
    dismissAlert: (id) => setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) })),
    cancel: (id) => setState((s) => ({
      ...s,
      shipments: s.shipments.map((sh) => sh.id === id
        ? {
            ...sh, status: "cancelled",
            timeline: [
              ...sh.timeline.filter((t) => t.state === "done" || t.state === "current").map((t) => ({ ...t, state: "done" as const })),
              { title: "Cancelled by shipper", location: sh.origin.city ?? "", time: new Date().toISOString(), state: "issue" as const },
            ],
          }
        : sh),
    })),
    generateDocument: (shipmentId, type) => {
      const sh = state.shipments.find((x) => x.id === shipmentId);
      const doc: DocumentRecord = { id: rid("doc"), type, shipmentId, filename: `${type}-${sh?.trackingId ?? shipmentId}.pdf`, createdAt: new Date().toISOString() };
      setState((s) => ({ ...s, documents: [doc, ...s.documents] }));
      return doc;
    },
    reset: () => setState(fresh()),
  }), [state]);

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
