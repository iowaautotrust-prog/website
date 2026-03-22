import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Iowa Auto Trust <noreply@iowaautotrust.com>";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { email, name } = await req.json();
  if (!email) return new Response("Missing email", { status: 400 });

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">Welcome to Iowa Auto Trust, ${name ?? ""}!</h2>
      <p>Thanks for creating an account. You can now:</p>
      <ul>
        <li>Save your favorite vehicles</li>
        <li>Track your service appointments</li>
        <li>View your invoices</li>
      </ul>
      <a href="https://iowaautotrust.com/inventory"
        style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
        Browse Inventory
      </a>
      <p style="margin-top:32px;color:#6b7280;font-size:13px;">Iowa Auto Trust · Woodward, Iowa · (515) 672-5406</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: email, subject: "Welcome to Iowa Auto Trust!", html }),
  });

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
});
