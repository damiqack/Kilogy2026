import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { seedDocuments, seedPayments, seedShipments } from "./seed";
import type { DocumentRecord, Payment, Quote, RankedOption, Shipment } from "./types";

/**
 * Client-side store for the prototype. Stands in for the Shipment, Document and Payment services
 * until services/api is running. Saved to localStorage so bookings survive a reload.
 */
interface State {
  shipments: Shipment[];
  documents: DocumentRecord[];
  payments: Payment[];
  quotes: Quote[];
}

interface Store extends State {
  saveQuote: (q: Quote) => void;
  book: (quote: Quote, option: RankedOption) => Shipment;
  cancel: (id: string) => void;
  generateDocument: (shipmentId: string, type: DocumentRecord["type"]) => DocumentRecord;
  reset: () => void;
}

const KEY = "kilogy2026.web.state.v1";
const StoreCtx = createContext<Store | null>(null);

function initial(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* storage unavailable */
  }
  return { shipments: seedShipments(), documents: seedDocuments(), payments: seedPayments(), quotes: [] };
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
    book: (quote, option) => {
      const now = new Date().toISOString();
      const shipment: Shipment = {
        id: rid("shp"),
        reference: `KG-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: now,
        status: "booked",
        origin: quote.request.origin,
        destination: quote.request.destination,
        package: quote.request.package,
        selected: option,
        trackingNumber: `${option.carrier_id.toUpperCase()}${Math.floor(1e9 + Math.random() * 9e9)}`,
        events: [
          { status: "created", description: "Shipment created from AI quote", location: quote.request.origin.city ?? quote.request.origin.country, timestamp: now },
          { status: "booked", description: `Booked with ${option.carrier_name} (${option.service})`, location: quote.request.origin.city ?? "", timestamp: now },
        ],
      };
      const payment: Payment = { id: rid("pay"), shipmentId: shipment.id, amount_usd: option.price_usd, status: "succeeded", method: "Visa •••• 4242", createdAt: now };
      const label: DocumentRecord = { id: rid("doc"), type: "label", shipmentId: shipment.id, filename: `label-${shipment.reference}.pdf`, createdAt: now };
      setState((s) => ({
        ...s,
        shipments: [shipment, ...s.shipments],
        payments: [payment, ...s.payments],
        documents: [label, ...s.documents],
      }));
      return shipment;
    },
    cancel: (id) => setState((s) => ({
      ...s,
      shipments: s.shipments.map((sh) => sh.id === id
        ? { ...sh, status: "cancelled", events: [...sh.events, { status: "cancelled", description: "Cancelled by shipper", location: "", timestamp: new Date().toISOString() }] }
        : sh),
    })),
    generateDocument: (shipmentId, type) => {
      const sh = state.shipments.find((x) => x.id === shipmentId);
      const doc: DocumentRecord = { id: rid("doc"), type, shipmentId, filename: `${type}-${sh?.reference ?? shipmentId}.pdf`, createdAt: new Date().toISOString() };
      setState((s) => ({ ...s, documents: [doc, ...s.documents] }));
      return doc;
    },
    reset: () => setState({ shipments: seedShipments(), documents: seedDocuments(), payments: seedPayments(), quotes: [] }),
  }), [state]);

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
