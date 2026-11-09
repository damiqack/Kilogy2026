import { useSearchParams } from "react-router-dom";

/**
 * Filter state kept in the page URL (e.g. /shipments?carrier=DHL%20Express&mode=air),
 * so a filtered view survives a reload and can be shared as a link.
 * Lists are stored comma-separated.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();

  const get = (k: K) => params.get(k) ?? "";
  const getList = (k: K) => get(k).split(",").filter(Boolean);

  type Value = string | string[] | null | undefined;
  /** Set several filters at once; an empty value removes that filter from the URL. */
  const setMany = (values: Partial<Record<K, Value>>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, value] of Object.entries(values) as [K, Value][]) {
        const v = Array.isArray(value) ? value.join(",") : value ?? "";
        if (v) next.set(k, v);
        else next.delete(k);
      }
      return next;
    }, { replace: true });
  const set = (k: K, value: Value) => setMany({ [k]: value } as Partial<Record<K, Value>>);

  const clear = () =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    }, { replace: true });

  const activeCount = keys.filter((k) => params.get(k)).length;
  return { get, getList, set, setMany, clear, activeCount };
}
