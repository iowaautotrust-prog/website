// Supabase Edge Function: send-lead-notification
// Sends an email to the admin whenever a new lead is submitted (contact form, request
// information, test drive, interest dialog).
// Requires RESEND_API_KEY set via: supabase secrets set RESEND_API_KEY=re_...
// Optional: LEAD_NOTIFY_EMAILS="a@x.com,b@y.com" to change/add recipients without a code change.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAILS = (Deno.env.get("LEAD_NOTIFY_EMAILS") ?? "sales@iowatrustmotors.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
const SITE_URL = "https://iowatrustmotors.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Visitor-supplied text goes into an HTML email, so it must be escaped.
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const row = (label: string, value: string, shade: boolean) =>
  `<tr>
    <td style="padding:10px 12px;border:1px solid #e2e8f0;background:${shade ? "#f8fafc" : "#fff"};font-weight:600;width:120px">${label}</td>
    <td style="padding:10px 12px;border:1px solid #e2e8f0;background:${shade ? "#f8fafc" : "#fff"}">${value}</td>
  </tr>`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, vehicleName, vehicleId, message, leadType, leadSource } =
      await req.json();

    const typeLabel =
      leadType === "test_drive"
        ? "Test Drive Request"
        : leadType === "contact"
        ? "Contact Form"
        : "Vehicle Inquiry";

    const rows = [
      row("Name", esc(name), false),
      row("Email", `<a href="mailto:${esc(email)}" style="color:#1e40af">${esc(email)}</a>`, true),
      row("Phone", phone ? `<a href="tel:${esc(phone)}" style="color:#1e40af">${esc(phone)}</a>` : "—", false),
      ...(vehicleName
        ? [
            row(
              "Vehicle",
              vehicleId
                ? `<a href="${SITE_URL}/vehicle/${esc(vehicleId)}" style="color:#1e40af">${esc(vehicleName)}</a>`
                : esc(vehicleName),
              true
            ),
          ]
        : []),
      row("Source", esc(leadSource ?? "Direct"), !vehicleName),
      row("Message", esc(message ?? "—").replace(/\n/g, "<br>"), !!vehicleName),
    ].join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1e40af;color:white;padding:24px 32px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:20px">New ${typeLabel}</h2>
          <p style="margin:4px 0 0;opacity:0.8;font-size:14px">Iowa Trust Motors — Johnston, Iowa</p>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">${rows}</table>
          <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:6px;border-left:4px solid #1e40af">
            <p style="margin:0;font-size:14px;color:#1e40af">
              Reply fast: the first dealer to answer usually wins the sale. Manage this inquiry in your
              <a href="${SITE_URL}/admin/leads" style="font-weight:600">Admin → Leads</a>
              panel.
            </p>
          </div>
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Iowa Trust Motors <notifications@iowatrustmotors.com>",
        to: ADMIN_EMAILS,
        reply_to: typeof email === "string" && email.includes("@") ? email : undefined,
        subject: `New ${typeLabel} from ${String(name ?? "").replace(/[\r\n]+/g, " ").slice(0, 80)}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return new Response(
        JSON.stringify({ error: errText }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
