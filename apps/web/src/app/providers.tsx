import { App as AntApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import { useMemo, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../data/auth";
import { StoreProvider } from "../data/store";
import { buildTheme } from "../theme/theme";

/**
 * App-wide providers: theme, locale, data store, router and staff sign-in.
 * The app uses one light theme (navy sidebar, light content); there is no dark mode.
 */
export function Providers({ children }: { children: ReactNode }) {
  const theme = useMemo(() => buildTheme(), []);
  return (
    <ConfigProvider theme={theme} locale={enUS}>
      <AntApp>
        <StoreProvider>
          <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
          </BrowserRouter>
        </StoreProvider>
      </AntApp>
    </ConfigProvider>
  );
}
