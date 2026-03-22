import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Iowa Auto Trust <noreply@iowaautotrust.com>";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const {
    email, name, invoiceNumber, invoiceId,
    items, subtotal, taxAmount, discount, total,
    jobNumber, nextServiceDate, nextServiceMileage,
  } = await req.json();
  if (!email || !invoiceNumber) return new Response("Missing required fields", { status: 400 });

  const itemRows = (items ?? []).map((item: { service_type: string; oil_type?: string; quantity?: number; unit?: string; unit_price: number }) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px;">${item.service_type}${item.oil_type ? ` — ${item.oil_type}` : ""}${item.quantity ? ` (${item.quantity} ${item.unit ?? ""})` : ""}</td>
      <td style="padding:8px;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
    </tr>`).join("");

  const nextServiceHtml = (nextServiceDate || nextServiceMileage) ? `
    <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:8px;">
      <h3 style="margin:0 0 8px;color:#1e40af;">Next Service Recommendation</h3>
      ${nextServiceDate ? `<p style="margin:4px 0;">Date: <strong>${nextServiceDate}</strong></p>` : ""}
      ${nextServiceMileage ? `<p style="margin:4px 0;">Mileage: <strong>${Number(nextServiceMileage).toLocaleString()} miles</strong></p>` : ""}
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">We'll send you a reminder when it's time!</p>
    </div>` : "";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e40af;">Invoice ${invoiceNumber}</h2>
      <p>Hi ${name ?? "there"}, your vehicle service is complete. Here's your invoice.</p>
      ${jobNumber ? `<p style="color:#6b7280;">Job #: ${jobNumber}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px;text-align:left;">Service</th>
          <th style="padding:8px;text-align:right;">Amount</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="width:100%;margin-top:8px;">
        <tr><td style="text-align:right;padding:4px;color:#6b7280;">Subtotal:</td><td style="text-align:right;padding:4px;width:100px;">$${Number(subtotal ?? 0).toFixed(2)}</td></tr>
        ${taxAmount ? `<tr><td style="text-align:right;padding:4px;color:#6b7280;">Tax:</td><td style="text-align:right;padding:4px;">$${Number(taxAmount).toFixed(2)}</td></tr>` : ""}
        ${discount ? `<tr><td style="text-align:right;padding:4px;color:#6b7280;">Discount:</td><td style="text-align:right;padding:4px;color:#16a34a;">-$${Number(discount).toFixed(2)}</td></tr>` : ""}
        <tr><td style="text-align:right;padding:8px;font-weight:700;">Total:</td><td style="text-align:right;padding:8px;font-weight:700;font-size:18px;">$${Number(total ?? 0).toFixed(2)}</td></tr>
      </table>
      ${invoiceId ? `<a href="https://iowaautotrust.com/shop/invoices/${invoiceId}"
        style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
        View &amp; Print Invoice
      </a>` : ""}
      ${nextServiceHtml}
      <p style="margin-top:32px;color:#6b7280;font-size:13px;">Iowa Auto Trust · Woodward, Iowa · (515) 672-5406</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: email, subject: `Your Invoice ${invoiceNumber} – Iowa Auto Trust`, html }),
  });

  return new Response(JSON.stringify({ ok: res.ok }), {
    status: res.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
});
