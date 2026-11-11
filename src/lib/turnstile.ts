// Cloudflare Turnstile site key (public, meant to be embedded in the page — not a secret).
// Set VITE_TURNSTILE_SITE_KEY in .env and in Netlify's environment variables.
// Empty string = the widget renders nothing and every form works exactly as before (no CAPTCHA).
export const TURNSTILE_SITE_KEY: string = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";
