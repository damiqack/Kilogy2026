import {
  ApiOutlined, ArrowRightOutlined, BarChartOutlined, BranchesOutlined, ClusterOutlined, CreditCardOutlined, DashboardOutlined,
  DollarOutlined, EnvironmentOutlined, InboxOutlined, RiseOutlined, WarningOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import heroPhoto from "../../assets/photos/cta-network.webp";
import ambitionPhoto from "../../assets/photos/slide-multimodal.webp";
import { PublicFooter, PublicHeader, useScrollOnNavigate } from "../../components/PublicChrome";
import "../landing/landing.css";
import { ABOUT_HERO, ABOUT_INTRO, AMBITION, AUDIENCE, CHALLENGE, COMMITMENT, HOW, MISSION, PRINCIPLES, SOLUTION_INTRO, SOLUTIONS, VISION } from "./about-content";
import "./public.css";

const SOLUTION_ICONS = [<DashboardOutlined />, <ApiOutlined />, <DollarOutlined />, <BranchesOutlined />, <EnvironmentOutlined />,
  <InboxOutlined />, <RiseOutlined />, <BarChartOutlined />, <CreditCardOutlined />, <ClusterOutlined />];

/** About us page at /about (copy in about-content.ts). */
export function AboutPage() {
  useScrollOnNavigate();
  const navigate = useNavigate();
  return (
    <div className="pub">
      <PublicHeader />
      <section className="pub-hero has-photo" style={{ backgroundImage: `url(${heroPhoto})` }}>
        <div className="lp-wrap">
          <span className="lp-eyebrow">About us</span>
          <h1>{ABOUT_HERO.title}</h1>
          <p>{ABOUT_HERO.body}</p>
        </div>
      </section>

      <section className="lp-wrap pub-section">
        {ABOUT_INTRO.map((p) => <p key={p} className="pub-lead">{p}</p>)}
        <div className="ab-pair">
          <div className="ab-card"><h3>Our mission</h3><p>{MISSION}</p></div>
          <div className="ab-card"><h3>Our vision</h3><p>{VISION}</p></div>
        </div>
      </section>

      <section className="lp-wrap pub-section ab-challenge">
        <div>
          <span className="lp-eyebrow is-dark">The challenge we address</span>
          <h2 className="pub-h2">Logistics is spread across too many systems</h2>
          <p className="pub-lead">{CHALLENGE.body}</p>
          <p className="pub-lead" style={{ marginBottom: 0 }}>{CHALLENGE.close}</p>
        </div>
        <div>
          <p className="pub-lead" style={{ marginBottom: 12, color: "#0f172a", fontWeight: 600 }}>{CHALLENGE.lead}</p>
          <ul>{CHALLENGE.points.map((p) => <li key={p}><WarningOutlined />{p}</li>)}</ul>
        </div>
      </section>

      <section className="lp-wrap pub-section">
        <span className="lp-eyebrow is-dark">Our solution</span>
        <h2 className="pub-h2">One platform for the whole shipment</h2>
        <p className="pub-lead">{SOLUTION_INTRO}</p>
        <ul className="ab-grid">
          {SOLUTIONS.map((s, i) => (
            <li key={s.title}><span className="ico" aria-hidden>{SOLUTION_ICONS[i]}</span><h3>{s.title}</h3><p>{s.body}</p></li>
          ))}
        </ul>
      </section>

      <section className="lp-wrap pub-section">
        <span className="lp-eyebrow is-dark">How KILOGY works</span>
        <p className="ab-flow-tag">{HOW.tagline}</p>
        <ol className="ab-flow">{HOW.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="ab-note">{HOW.note}</p>
      </section>

      <section className="lp-wrap pub-section">
        <span className="lp-eyebrow is-dark">Who we serve</span>
        <h2 className="pub-h2">Built for businesses that move goods across borders</h2>
        <ul className="ab-chips">{AUDIENCE.map((a) => <li key={a}>{a}</li>)}</ul>
      </section>

      <section className="lp-wrap pub-section">
        <span className="lp-eyebrow is-dark">Our technology philosophy</span>
        <h2 className="pub-h2">Five principles</h2>
        <ul className="ab-principles">{PRINCIPLES.map((p) => <li key={p.title}><b>{p.title}</b><span>{p.body}</span></li>)}</ul>
      </section>

      <section className="lp-wrap pub-section ab-ambition">
        <img src={ambitionPhoto} alt="Container ship, truck and cargo plane at a port at night" loading="lazy" />
        <div>
          <span className="lp-eyebrow is-dark">Our global ambition</span>
          <h2 className="pub-h2">Starting with Canada and Africa</h2>
          {AMBITION.map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>

      <section className="lp-wrap">
        <div className="lp-cta" style={{ backgroundImage: "none" }}>
          <div>
            <h2>Our commitment</h2>
            <p>{COMMITMENT}</p>
          </div>
          <Button size="large" onClick={() => navigate("/contact")}>Contact us <ArrowRightOutlined /></Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
