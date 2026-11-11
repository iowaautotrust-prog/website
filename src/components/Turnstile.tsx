import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile (CAPTCHA) widget. Supabase enforces a valid token on sign-up, sign-in
// AND password reset together once its secret key is saved in Authentication -> Attack Protection —
// so every form that calls one of those needs this widget, not just Signup.

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("load failed")));
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("load failed"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Call after a failed submit: a token is single-use, so a retry needs a fresh one. */
  reset: () => void;
}

interface Props {
  siteKey: string;
  onVerify: (token: string | null) => void;
  className?: string;
}

/** Renders nothing (and never blocks the form) when siteKey is empty, e.g. local dev with no key set. */
const Turnstile = forwardRef<TurnstileHandle, Props>(({ siteKey, onVerify, className }, ref) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const containerId = `turnstile-${id}`;
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId.current = window.turnstile.render(`#${containerId}`, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onVerify(null),
          "error-callback": () => onVerify(null),
        });
      })
      .catch(() => onVerify(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, containerId]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      onVerify(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  if (!siteKey) return null;
  return <div id={containerId} className={className} />;
});
Turnstile.displayName = "Turnstile";

export default Turnstile;
