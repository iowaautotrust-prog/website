import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Pages that are for staff or for signing in, not for search results.
// (public/_headers sends the same noindex as an HTTP header; this adds the meta tag as well.)
const PRIVATE = /^\/(admin|shop|login|signup|forgot-password|reset-password|auth|profile)(\/|$)/;

const RobotsGuard = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!PRIVATE.test(pathname)) return;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
    // Leaving for a public page: drop it again so the page can be indexed.
    return () => {
      document.head.querySelector('meta[name="robots"]')?.remove();
    };
  }, [pathname]);
  return null;
};

export default RobotsGuard;
