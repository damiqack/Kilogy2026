import { useEffect, useState } from "react";
import { aiEngineHealthy } from "./ai";

/** Polls the AI engine health endpoint. null while the first check runs. */
export function useEngineStatus(intervalMs = 15000): boolean | null {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const check = () => aiEngineHealthy().then((ok) => alive && setLive(ok));
    check();
    const t = setInterval(check, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, [intervalMs]);
  return live;
}
