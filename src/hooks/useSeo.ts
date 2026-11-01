import { useEffect } from "react";
import { SITE } from "@/lib/siteConfig";

interface SeoOptions {
  title: string;
  description: string;
  /** Path (e.g. "/inventory") or absolute URL on iowatrustmotors.com. */
  canonical: string;
  image?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

const upsertMeta = (attr: "name" | "property", key: string, content: string): void => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * Keeps <title>, meta description, canonical, Open Graph and page JSON-LD in sync while the
 * visitor navigates inside the app. (The first load is already filled in server-side by the
 * Netlify edge function; this covers client-side navigation and Google's rendered pass.)
 */
export function useSeo({ title, description, canonical, image, ogType = "website", noindex, jsonLd }: SeoOptions): void {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const prevTitle = document.title;
    const url = canonical.startsWith("http") ? canonical : `${SITE.url}${canonical}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, follow";
    } else if (robots) {
      robots.remove();
    }

    let script: HTMLScriptElement | null = null;
    if (jsonKey) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "page";
      script.text = jsonKey;
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      script?.remove();
      // Pages that don't use this hook (admin, login...) shouldn't inherit a canonical or noindex.
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('meta[name="robots"]')?.remove();
    };
  }, [title, description, canonical, image, ogType, noindex, jsonKey]);
}
