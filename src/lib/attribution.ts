// Remembers where a visitor came from (referrer / UTM) for the current browser
// session, so a lead submitted later can be tagged Google / Facebook / Direct / Other.
// sessionStorage only: it is cleared when the tab closes, and nothing is sent anywhere
// until the visitor submits a form.

import type { LeadSource } from "./types";

const KEY = "iat_attribution";

export interface Attribution {
  lead_source: LeadSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

/** Map a UTM source or referrer hostname to one of the four lead sources. */
export const classifySource = (utmSource: string | null, referrerHost: string, ownHost: string): LeadSource => {
  const s = (utmSource ?? "").toLowerCase();
  const h = referrerHost.replace(/^www\./, "");
  if (s) {
    if (/google|gmb|gbp/.test(s)) return "Google";
    if (/facebook|^fb$|instagram|^ig$|meta/.test(s)) return "Facebook";
    return "Other";
  }
  if (!h || h === ownHost.replace(/^www\./, "")) return "Direct";
  if (/(^|\.)google\./.test(h)) return "Google";
  if (/(^|\.)(facebook|fb|instagram)\.com$|(^|\.)l\.facebook\.com$|^fb\.me$/.test(h)) return "Facebook";
  return "Other";
};

/** Call once on app start. Keeps the first-touch source for the session. */
export const captureAttribution = (): void => {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get("utm_source");
    const utm_medium = params.get("utm_medium");
    const utm_campaign = params.get("utm_campaign");
    const lead_source = classifySource(utm_source, hostOf(document.referrer), window.location.hostname);
    const value: Attribution = { lead_source, utm_source, utm_medium, utm_campaign };
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) – fall through to Direct
  }
};

export const getAttribution = (): Attribution => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Attribution;
  } catch {
    // ignore
  }
  return { lead_source: "Direct", utm_source: null, utm_medium: null, utm_campaign: null };
};
