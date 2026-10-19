import { App as AntApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import { useMemo, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "../data/store";
import { buildTheme } from "../theme/theme";

/**
 * App-wide providers: theme, locale, data store and router.
 * Kilogy's mockups are light-only (navy sidebar, light content), so there is no dark mode.
 */
export function Providers({ children }: { children: ReactNode }) {
  const theme = useMemo(() => buildTheme(), []);
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
