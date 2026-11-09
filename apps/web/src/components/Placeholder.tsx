import { Fragment } from "react";

/**
 * Renders text from Kilogy's website content document, highlighting bracketed placeholders
 * such as "[Privacy email address]" that Kilogy still has to confirm before publication.
 */
export function Fill({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/);
  return (
    <>
      {parts.map((p, i) =>
        /^\[[^\]]+\]$/.test(p)
          ? <mark key={i} className="kph" title="To be confirmed by Kilogy before publication">{p}</mark>
          : <Fragment key={i}>{linkify(p)}</Fragment>)}
    </>
  );
}

function linkify(text: string) {
  const parts = text.split(/(https:\/\/www\.kilogy\.co)/);
  return parts.map((p, i) => (p === "https://www.kilogy.co" ? <a key={i} href={p} target="_blank" rel="noreferrer">kilogy.co</a> : p));
}
