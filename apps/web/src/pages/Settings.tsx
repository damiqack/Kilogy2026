import { useState } from "react";
import { useStore } from "../data/store";
import { USD_TO_CAD } from "../lib/money";

export function Settings() {
  const { reset } = useStore();
  const [notif, setNotif] = useState({ email: true, sms: false, webhook: true, aiAlerts: true });
  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p className="sub">Account, organization and notification preferences.</p></div></div>
      <div className="grid g-2">
        <section className="card card-pad stack" style={{ gap: 16 }} aria-labelledby="org-h">
          <h2 id="org-h">Organization</h2>
          <div className="field"><label htmlFor="org">Company name</label><input id="org" className="input" defaultValue="Kilogy Demo Shipper Inc." /></div>
          <div className="field"><label htmlFor="cur">Display currency</label>
            <select id="cur" className="select" defaultValue="CAD"><option value="CAD">CAD — Canadian dollar</option><option value="USD" disabled>USD (coming soon)</option></select>
          </div>
          <span className="caption">Prototype FX rate: 1 USD = {USD_TO_CAD} CAD.</span>
        </section>
        <section className="card card-pad stack" style={{ gap: 14 }} aria-labelledby="n-h">
          <h2 id="n-h">Notifications</h2>
          {([["email", "Email updates (SendGrid)"], ["sms", "SMS alerts (Twilio)"], ["webhook", "Webhook events"], ["aiAlerts", "Proactive AI alerts on the dashboard"]] as const).map(([k, label]) => (
            <label key={k} className="check"><input type="checkbox" checked={notif[k]} onChange={(e) => setNotif({ ...notif, [k]: e.target.checked })} /> {label}</label>
          ))}
        </section>
        <section className="card card-pad stack" style={{ gap: 12 }} aria-labelledby="d-h">
          <h2 id="d-h">Prototype data</h2>
          <p className="muted" style={{ margin: 0 }}>Bookings you make are saved in this browser. Reset to restore the sample shipments.</p>
          <div><button className="btn" onClick={reset}>Reset sample data</button></div>
        </section>
      </div>
    </>
  );
}
