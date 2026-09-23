import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Analytics } from "./pages/Analytics";
import { Carriers } from "./pages/Carriers";
import { Dashboard } from "./pages/Dashboard";
import { Developers } from "./pages/Developers";
import { Documents } from "./pages/Documents";
import { NewQuote } from "./pages/NewQuote";
import { NotFound } from "./pages/NotFound";
import { Payments } from "./pages/Payments";
import { ShipmentDetail } from "./pages/ShipmentDetail";
import { Shipments } from "./pages/Shipments";
import { SystemArchitecture } from "./pages/SystemArchitecture";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="quotes/new" element={<NewQuote />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="carriers" element={<Carriers />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="documents" element={<Documents />} />
        <Route path="payments" element={<Payments />} />
        <Route path="developers" element={<Developers />} />
        <Route path="system" element={<SystemArchitecture />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
