import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AnalyticsPage } from "../pages/Analytics";
import { CarriersPage } from "../pages/Carriers";
import { DashboardPage } from "../pages/Dashboard";
import { DevelopersPage } from "../pages/Developers";
import { DocumentsPage } from "../pages/Documents";
import { LandingPage } from "../pages/landing/Landing";
import { NewShipmentPage } from "../pages/NewShipment";
import { NotFoundPage } from "../pages/NotFound";
import { PaymentsPage } from "../pages/Payments";
import { QuoteDetailPage } from "../pages/QuoteDetail";
import { QuotesPage } from "../pages/Quotes";
import { SettingsPage } from "../pages/Settings";
import { ShipmentDetailPage } from "../pages/ShipmentDetail";
import { ShipmentsPage } from "../pages/Shipments";
import { SignInPage } from "../pages/SignIn";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public homepage (no app shell) */}
      <Route index element={<LandingPage />} />
      <Route path="login" element={<SignInPage />} />

      {/* Signed-in app */}
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/new" element={<NewShipmentPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/new" element={<Navigate to="/shipments/new" replace />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="carriers" element={<CarriersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="developers" element={<DevelopersPage />} />
        <Route path="system" element={<Navigate to="/developers?tab=architecture" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
