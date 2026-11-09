import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AnalyticsPage } from "../pages/Analytics";
import { CarriersPage } from "../pages/Carriers";
import { ComingSoonPage } from "../pages/ComingSoon";
import { ControlTowerPage } from "../pages/ControlTower";
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
import { COMING_SOON } from "../config/navigation";
import { RequireAuth } from "../data/auth";
import { ProfilePage } from "../pages/Profile";
import { ReportsPage } from "../pages/Reports";
import { SignInPage } from "../pages/SignIn";
import { AboutPage } from "../pages/public/About";
import { ContactPage } from "../pages/public/Contact";
import { LegalPage } from "../pages/public/Legal";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public homepage (no app shell) */}
      <Route index element={<LandingPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="legal" element={<LegalPage />} />
      {/* Staff sign-in (administrators and developers only) */}
      <Route path="login" element={<SignInPage />} />
      <Route path="sign-in" element={<Navigate to="/login" replace />} />

      {/* App. Pages are open in the prototype; wrap an element in <RequireAuth> to make it staff-only. */}
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/new" element={<NewShipmentPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/new" element={<Navigate to="/shipments/new" replace />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="carriers" element={<CarriersPage />} />
        <Route path="tracking" element={<ControlTowerPage />} />
        {COMING_SOON.map((n) => <Route key={n.path} path={n.path.slice(1)} element={<ComingSoonPage />} />)}
        <Route path="assistant" element={<ComingSoonPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="developers" element={<DevelopersPage />} />
        <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="reports" element={<RequireAuth roles={["admin"]}><ReportsPage /></RequireAuth>} />
        <Route path="system" element={<Navigate to="/developers?tab=architecture" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
