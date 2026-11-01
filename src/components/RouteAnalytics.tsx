import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/** Sends a GA4 page_view on in-app navigation (no-op until the visitor accepts cookies). */
export default function RouteAnalytics() {
  const { pathname, search } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    // The first page view is sent by initAnalytics() itself.
    if (first.current) {
      first.current = false;
      return;
    }
    // Wait a tick so the page has set its own <title> first.
    const t = setTimeout(() => trackPageView(pathname + search), 150);
    return () => clearTimeout(t);
  }, [pathname, search]);
  return null;
}
