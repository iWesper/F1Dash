import { useEffect, useState } from "react";

/** Current time, re-rendering every `intervalMs`. Pauses while the tab is hidden. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const start = () => {
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), intervalMs);
    };
    const onVisibility = () => {
      clearInterval(timer);
      if (!document.hidden) start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return now;
}

/** Sets document.title for the current page. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · F1 Dash` : "F1 Dash";
  }, [title]);
}
