// The pages the React app really has. Anything else is a "page not found" and must answer HTTP 404,
// not the home page with a 200 (a "soft 404", which search engines treat as thin duplicate content).
//
// Keep in sync with the <Route path="..."> list in src/App.tsx. src/test/routes.test.ts reads App.tsx
// and fails if a route is added there but not here.

const EXACT = new Set([
  "/",
  "/inventory",
  "/compare",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/profile",
  "/admin",
  "/admin/inventory",
  "/admin/categories",
  "/admin/import",
  "/admin/leads",
  "/admin/transactions",
  "/admin/users",
  "/admin/discounts",
  "/admin/quiz",
  "/shop",
  "/shop/customers",
  "/shop/jobs",
  "/shop/appointments",
  "/shop/invoices",
  "/shop/inventory",
  "/shop/reports",
  "/service",
  "/service/track",
]);

const PATTERNS = [
  /^\/vehicle\/[^/]+$/,
  /^\/shop\/customers\/[^/]+$/,
  /^\/shop\/jobs\/[^/]+$/,
  /^\/shop\/invoices\/[^/]+\/print$/,
  /^\/service\/track\/[^/]+$/,
];

export const normalizePath = (pathname: string): string => pathname.replace(/\/+$/, "") || "/";

export const isKnownRoute = (pathname: string): boolean => {
  const p = normalizePath(pathname);
  return EXACT.has(p) || PATTERNS.some((re) => re.test(p));
};
