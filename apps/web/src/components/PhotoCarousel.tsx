import { LeftOutlined, PauseOutlined, CaretRightOutlined, RightOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

export interface Slide {
  src: string;
  alt: string;
  title: string;
  body: string;
  /** Small label on the caption, e.g. "Coming soon" */
  tag?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Photo carousel with captions. Advances every few seconds; pauses while hovered or focused,
 * has a pause button (WCAG 2.2.2) and does not auto-advance when the user prefers reduced motion.
 */
export function PhotoCarousel({ slides, label, interval = 6000 }: { slides: Slide[]; label: string; interval?: number }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(prefersReducedMotion);
  const go = (i: number) => setIndex((i + n) % n);

  useEffect(() => {
    if (stopped || hovered || n < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), interval);
    return () => clearInterval(t);
  }, [stopped, hovered, n, interval]);

  return (
    <section
      className="kcar"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(index - 1); if (e.key === "ArrowRight") go(index + 1); }}
    >
      <div className="kcar-viewport">
        <div className="kcar-track" style={{ transform: `translateX(-${index * 100}%)` }} aria-live={stopped ? "polite" : "off"}>
          {slides.map((s, i) => (
            <div key={s.src} className="kcar-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${s.title}`} aria-hidden={i !== index}>
              <img src={s.src} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} />
              <div className="kcar-caption">
                {s.tag && <span className="kcar-tag">{s.tag}</span>}
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="kcar-arrow is-prev" aria-label="Previous slide" onClick={() => go(index - 1)}><LeftOutlined /></button>
        <button type="button" className="kcar-arrow is-next" aria-label="Next slide" onClick={() => go(index + 1)}><RightOutlined /></button>
      </div>
      <div className="kcar-controls">
        <button type="button" className="kcar-play" aria-label={stopped ? "Play slideshow" : "Pause slideshow"} onClick={() => setStopped((v) => !v)}>
          {stopped ? <CaretRightOutlined /> : <PauseOutlined />}
        </button>
        <div className="kcar-dots">
          {slides.map((s, i) => (
            <button key={s.src} type="button" aria-label={`Show slide ${i + 1}: ${s.title}`} aria-current={i === index} className={i === index ? "is-on" : ""} onClick={() => go(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
