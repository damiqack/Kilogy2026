import { WarningOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Fill } from "../../components/Placeholder";
import { PublicFooter, PublicHeader, useScrollOnNavigate } from "../../components/PublicChrome";
import "../landing/landing.css";
import DOCS from "./legal-documents.json";
import "./public.css";

type Block =
  | { type: "h" | "h3" | "note"; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] };
interface LegalDoc { id: string; title: string; meta: { label: string; value: string }[]; blocks: Block[] }

/**
 * Legal page at /legal. The documents come from Kilogy's "Website Content & Legal Framework"
 * (pages 2–7 and 9), stored in legal-documents.json. Each one has its own anchor, e.g. /legal#privacy.
 */
const docs = DOCS as LegalDoc[];

function Doc({ doc }: { doc: LegalDoc }) {
  return (
    <article id={doc.id} className="lg-doc" aria-labelledby={`${doc.id}-title`}>
      <h2 id={`${doc.id}-title`}>{doc.title}</h2>
      {doc.meta.length > 0 && (
        <div className="lg-meta">{doc.meta.map((m) => <span key={m.label}>{m.label}: <Fill text={m.value} /></span>)}</div>
      )}
      {doc.blocks.map((b, i) => {
        switch (b.type) {
          case "h": return <h3 key={i}>{b.text}</h3>;
          case "h3": return <h4 key={i}>{b.text}</h4>;
          case "note": return <p key={i} className="lg-note">Drafting note: {b.text}</p>;
          case "ul": return <ul key={i}>{b.items.map((t) => <li key={t}><Fill text={t} /></li>)}</ul>;
          case "p": return <p key={i}>{b.lines.map((l, j) => <span key={j}>{j > 0 && <br />}<Fill text={l} /></span>)}</p>;
        }
      })}
      <a href="#top" className="lg-top">Back to top</a>
    </article>
  );
}

export function LegalPage() {
  useScrollOnNavigate();
  const [active, setActive] = useState(docs[0].id);

  // Highlight the document currently on screen in the table of contents.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "0px 0px -70% 0px" });
    docs.forEach((d) => { const el = document.getElementById(d.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <div className="pub" id="top">
      <PublicHeader />
      <section className="pub-hero">
        <div className="lp-wrap">
          <span className="lp-eyebrow">Legal</span>
          <h1>Policies and terms</h1>
          <p>How KILOGY handles your information, the terms for using the platform, and what a quote or carrier listing does and doesn't mean.</p>
        </div>
      </section>

      <div className="lp-wrap">
        <div className="pub-draft" role="note">
          <WarningOutlined />
          <span>
            <b>Draft for review.</b> These documents are not yet in effect. Highlighted items such as <mark className="kph">[Full Legal Entity Name]</mark> must
            be confirmed by KILOGY, and every document needs legal review for Canada and the other markets served before publication.
            Questions? <Link to="/contact?topic=privacy">Contact us</Link>.
          </span>
        </div>
      </div>

      <div className="lp-wrap lg-grid">
        <nav className="lg-toc" aria-label="Legal documents">
          <b>Documents</b>
          <ul>
            {docs.map((d) => <li key={d.id}><a href={`#${d.id}`} className={active === d.id ? "is-on" : ""} aria-current={active === d.id ? "location" : undefined}>{d.title}</a></li>)}
          </ul>
        </nav>
        <div>{docs.map((d) => <Doc key={d.id} doc={d} />)}</div>
      </div>

      <PublicFooter />
    </div>
  );
}
