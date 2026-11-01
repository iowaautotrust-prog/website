// Google Analytics 4, loaded only after the visitor clicks "Accept All" in the cookie banner.
// Set VITE_GA_MEASUREMENT_ID (e.g. G-XXXXXXXXXX) in the Netlify environment to turn it on.
// With no ID, or with "essential only" consent, nothing is loaded and every call is a no-op.

const CONSENT_KEY = "iat_cookie_consent";
const MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;

type GtagFn = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

let loaded = false;

export const hasAnalyticsConsent = (): boolean => {
  try {
    return localStorage.getItem(CONSENT_KEY) === "all";
  } catch {
    return false;
  }
};

/** Loads GA4 once, and only with consent. Safe to call repeatedly. */
export const initAnalytics = (): void => {
  if (loaded || !MEASUREMENT_ID || typeof document === "undefined" || !hasAnalyticsConsent()) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // page_view is sent by trackPageView so single-page navigation is counted too.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(s);
  trackPageView(window.location.pathname + window.location.search);
};

export const trackPageView = (path: string): void => {
  if (!loaded || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export type ClickEvent = "call_click" | "inquire_click" | "request_information_click" | "email_click" | "schedule_test_drive_click";

export const trackEvent = (name: ClickEvent, params: Record<string, unknown> = {}): void => {
  if (!loaded || !window.gtag) return;
  window.gtag("event", name, params);
};
