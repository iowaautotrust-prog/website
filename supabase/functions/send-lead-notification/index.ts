// Supabase Edge Function: send-lead-notification
// Sends an email to the admin whenever a new lead is submitted.
// Requires RESEND_API_KEY set via: supabase secrets set RESEND_API_KEY=re_...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "iowaautotrust@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, vehicleName, message, leadType } =
      await req.json();

    const typeLabel =
      leadType === "test_drive"
        ? "Test Drive Request"
        : leadType === "contact"
        ? "Contact Form"
        : "Vehicle Inquiry";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1e40af;color:white;padding:24px 32px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:20px">New ${typeLabel}</h2>
          <p style="margin:4px 0 0;opacity:0.8;font-size:14px">Iowa Auto Trust — Woodward, Iowa</p>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#fff;font-weight:600;width:120px">Name</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#fff">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Email</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc">
                <a href="mailto:${email}" style="color:#1e40af">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#fff;font-weight:600">Phone</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#fff">${phone ?? "—"}</td>
            </tr>
            ${
              vehicleName
                ? `<tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Vehicle</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc">${vehicleName}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#fff;font-weight:600">Message</td>
              <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#fff">${message ?? "—"}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:6px;border-left:4px solid #1e40af">
            <p style="margin:0;font-size:14px;color:#1e40af">
              Manage this inquiry in your
              <a href="https://iowa-auto-trust.vercel.app/admin/leads" style="font-weight:600">Admin → Leads</a>
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
        from: "Iowa Auto Trust <notifications@iowaautotrust.com>",
        to: [ADMIN_EMAIL],
        subject: `New ${typeLabel} from ${name}`,
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
