import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Iowa Auto Trust <noreply@iowaautotrust.com>";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { email, name, serviceType, scheduledAt, jobNumber } = await req.json();
  if (!email || !scheduledAt) return new Response("Missing required fields", { status: 400 });

  const dateStr = new Date(scheduledAt).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "America/Chicago",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">Appointment Confirmed</h2>
      <p>Hi ${name ?? "there"}, your appointment has been booked!</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#6b7280;">Service</td><td style="padding:8px;font-weight:600;">${serviceType}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Date &amp; Time</td><td style="padding:8px;font-weight:600;">${dateStr} (Central)</td></tr>
        ${jobNumber ? `<tr><td style="padding:8px;color:#6b7280;">Job #</td><td style="padding:8px;font-weight:600;">${jobNumber}</td></tr>` : ""}
      </table>
      ${jobNumber ? `<a href="https://iowaautotrust.com/service/track/${jobNumber}"
        style="display:inline-block;margin-top:8px;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
        Track Your Job
      </a>` : ""}
      <p style="margin-top:24px;">Questions? Call us at <a href="tel:5156725406">(515) 672-5406</a></p>
      <p style="color:#6b7280;font-size:13px;">Iowa Auto Trust · Woodward, Iowa</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: email, subject: `Appointment Confirmed – ${serviceType}`, html }),
  });

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
});
