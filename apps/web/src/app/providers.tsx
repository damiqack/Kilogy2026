import { App as AntApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "../data/store";
import { buildTheme } from "../theme/theme";

function usePrefersDark() {
  const query = "(prefers-color-scheme: dark)";
  const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

/** App-wide providers: theme, locale, data store and router. */
export function Providers({ children }: { children: ReactNode }) {
  const dark = usePrefersDark();
  const theme = useMemo(() => buildTheme(dark), [dark]);
  return (
    <ConfigProvider theme={theme} locale={enUS}>
      <AntApp>
        <StoreProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </StoreProvider>
      </AntApp>
    </ConfigProvider>
  );
}
