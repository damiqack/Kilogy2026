import { EventEmitter } from "events";

/**
 * In-process event bus standing in for Apache Kafka. Topic names match the planned Kafka topics
 * so services can move to Kafka producers/consumers without changing event shapes.
 */
export type Topic =
  | "shipment.created"
  | "shipment.booked"
  | "shipment.updated"
  | "shipment.cancelled"
  | "tracking.event"
  | "payment.succeeded"
  | "payment.failed"
  | "document.generated";

export interface BusEvent<T = unknown> {
  topic: Topic;
  key: string; // partition key, e.g. shipment id
  accountId: string;
  payload: T;
  timestamp: string;
}

class EventBus {
  private emitter = new EventEmitter();
  private log: BusEvent[] = [];

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  publish<T>(topic: Topic, key: string, accountId: string, payload: T) {
    const event: BusEvent<T> = { topic, key, accountId, payload, timestamp: new Date().toISOString() };
    this.log.push(event);
    if (this.log.length > 5000) this.log.shift();
    this.emitter.emit(topic, event);
    this.emitter.emit("*", event);
  }

  subscribe<T>(topic: Topic | "*", handler: (e: BusEvent<T>) => void) {
    this.emitter.on(topic, handler as (e: BusEvent) => void);
    return () => this.emitter.off(topic, handler as (e: BusEvent) => void);
  }

  history(filter?: (e: BusEvent) => boolean) {
    return filter ? this.log.filter(filter) : [...this.log];
  }

  reset() {
    this.log = [];
  }
}

export const bus = new EventBus();
