import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "./app/providers";
import { AppRoutes } from "./app/routes";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <AppRoutes />
    </Providers>
  </StrictMode>,
);
