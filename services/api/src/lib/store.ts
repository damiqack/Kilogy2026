/**
 * In-memory persistence standing in for PostgreSQL (shipments, quotes, payments) and MongoDB
 * (tracking events, documents). Every record carries an accountId, and reads are scoped to it,
 * which mirrors the row-level security planned for Postgres multi-tenancy.
 */
export interface Tenanted {
  id: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export class Collection<T extends Tenanted> {
  private rows = new Map<string, T>();

  insert(row: Omit<T, "createdAt" | "updatedAt">): T {
    const now = new Date().toISOString();
    const full = { ...row, createdAt: now, updatedAt: now } as T;
    this.rows.set(full.id, full);
    return full;
  }

  get(accountId: string, id: string): T | undefined {
    const row = this.rows.get(id);
    return row && row.accountId === accountId ? row : undefined;
  }

  update(accountId: string, id: string, patch: Partial<T>): T | undefined {
    const row = this.get(accountId, id);
    if (!row) return undefined;
    const next = { ...row, ...patch, id: row.id, accountId: row.accountId, updatedAt: new Date().toISOString() };
    this.rows.set(id, next);
    return next;
  }

  list(accountId: string, filter: (r: T) => boolean = () => true): T[] {
    return [...this.rows.values()].filter((r) => r.accountId === accountId && filter(r));
  }

  clear() {
    this.rows.clear();
  }
}

/** TTL cache standing in for Redis (carrier rates cached for 15 minutes). */
export class TtlCache<V> {
  private entries = new Map<string, { value: V; expires: number }>();

  get(key: string): V | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) {
      this.entries.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: V, ttlSeconds: number) {
    this.entries.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  }

  clear() {
    this.entries.clear();
  }
}
