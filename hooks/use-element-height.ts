"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The rendered height of an element, kept in sync as it grows and shrinks.
 *
 * Used for floating bars that overlay scrolling content: the content needs to
 * reserve the bar's height, and that height is not knowable up front because
 * the bar's contents come and go.
 */
export function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    setHeight(element.offsetHeight);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}
