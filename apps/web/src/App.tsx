import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Analytics } from "./pages/Analytics";
import { Carriers } from "./pages/Carriers";
import { Dashboard } from "./pages/Dashboard";
import { Developers } from "./pages/Developers";
import { Documents } from "./pages/Documents";
import { NewShipment } from "./pages/NewShipment";
import { NotFound } from "./pages/NotFound";
import { Payments } from "./pages/Payments";
import { QuoteDetail } from "./pages/QuoteDetail";
import { Quotes } from "./pages/Quotes";
import { Settings } from "./pages/Settings";
import { ShipmentDetail } from "./pages/ShipmentDetail";
import { Shipments } from "./pages/Shipments";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="shipments/new" element={<NewShipment />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="quotes/new" element={<Navigate to="/shipments/new" replace />} />
        <Route path="quotes/:id" element={<QuoteDetail />} />
        <Route path="carriers" element={<Carriers />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="documents" element={<Documents />} />
        <Route path="payments" element={<Payments />} />
        <Route path="settings" element={<Settings />} />
        <Route path="developers" element={<Developers />} />
        <Route path="system" element={<Navigate to="/developers?tab=architecture" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
