"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Renders a fenced ```mermaid block as an SVG diagram.
 *
 * Mermaid is loaded lazily and rendered client-side into a detached container
 * (mermaid.render, not mermaid.run) so a bad diagram from the model can never
 * take the rest of the scene down with it — on failure we just fall back to
 * the raw source in a `<pre>` so the learner still sees the intended content.
 */
export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/[:]/g, "-");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      if (cancelled) return;
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
          fontFamily: "inherit",
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="my-4 overflow-x-auto rounded-xl border border-line bg-ink/[0.04] p-4 text-[13px] text-ink/70">
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-5 flex justify-center overflow-x-auto rounded-xl border border-line bg-white p-4 [&_svg]:max-w-full"
      aria-label="Diagram"
    />
  );
}
