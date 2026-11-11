// Supabase Edge Function: send-lead-reply
// Lets an admin answer a lead from Admin -> Leads. The email goes out through Resend from sales@, with
// Reply-To sales@ and the customer's original message quoted below the reply. The reply is saved in
// lead_replies (the lead's history) only after Resend has accepted it, and a "new" lead becomes "contacted".
//
// Needs the secrets already used by send-lead-notification: LEAD_RESEND_API_KEY (or RESEND_API_KEY).
// Optional secrets:
//   LEAD_REPLY_FROM_EMAIL  default: Iowa Trust Motors <sales@iowatrustmotors.com>   (must be on the verified domain)
//   LEAD_REPLY_TO          default: sales@iowatrustmotors.com
//   LEAD_REPLY_BCC         e.g. "owner@example.com": a copy of every reply, so the team sees what was sent
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const RESEND_API_KEY = Deno.env.get("LEAD_RESEND_API_KEY") ?? Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("LEAD_REPLY_FROM_EMAIL") ?? "Iowa Trust Motors <sales@iowatrustmotors.com>";
const REPLY_TO = Deno.env.get("LEAD_REPLY_TO") ?? "sales@iowatrustmotors.com";
const BCC = (Deno.env.get("LEAD_REPLY_BCC") ?? "").split(",").map((e) => e.trim()).filter(Boolean);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SIGNATURE = "Iowa Trust Motors | 5421 NW Beaver Dr Unit 2, Johnston, IA 50131 | (515) 809-8051";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const paragraphs = (s: string): string => esc(s).replace(/\r?\n/g, "<br>");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  try {
    if (!RESEND_API_KEY) return reply(500, { error: "Email service not configured (no Resend key secret)." });
    if (!SUPABASE_URL || !SERVICE_KEY) return reply(500, { error: "Supabase environment is not available." });

    // 1. Who is calling? Must be a signed-in admin.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return reply(401, { error: "Please sign in again." });
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) return reply(401, { error: "Please sign in again." });

    const db = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: profile } = await db.from("profiles").select("is_admin").eq("id", userData.user.id).maybeSingle();
    if (!profile?.is_admin) return reply(403, { error: "Only admins can reply to leads." });

    // 2. What is being sent?
    const { leadId, subject, message } = await req.json();
    const cleanSubject = String(subject ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
    const body = String(message ?? "").trim();
    if (!leadId || !cleanSubject || !body) return reply(400, { error: "Subject and message are required." });
    if (body.length > 10000) return reply(400, { error: "The message is too long." });

    const { data: lead, error: leadErr } = await db.from("leads").select("*").eq("id", leadId).maybeSingle();
    if (leadErr || !lead) return reply(404, { error: "That lead no longer exists." });
    if (!lead.email || !String(lead.email).includes("@")) return reply(400, { error: "This lead has no valid email address." });

    // 3. Compose: the reply, then the customer's original message quoted.
    const when = new Date(lead.created_at).toLocaleString("en-US", {
      timeZone: "America/Chicago",
      dateStyle: "medium",
      timeStyle: "short",
    });
    const original = String(lead.message ?? "").trim() || "(no message)";
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111">
        <div>${paragraphs(body)}</div>
        <p style="margin:24px 0 0;color:#555;font-size:13px">${esc(SIGNATURE)}</p>
        <blockquote style="margin:24px 0 0;padding:0 0 0 14px;border-left:3px solid #ccc;color:#555">
          <p style="margin:0 0 6px;font-size:12px">On ${esc(when)}, ${esc(lead.name)} wrote:</p>
          <div style="font-size:14px">${paragraphs(original)}</div>
        </blockquote>
      </div>`;
    const text = `${body}\n\n${SIGNATURE}\n\nOn ${when}, ${lead.name} wrote:\n${original
      .split(/\r?\n/)
      .map((l: string) => `> ${l}`)
      .join("\n")}`;

    // 4. Send.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [lead.email],
        ...(BCC.length ? { bcc: BCC } : {}),
        reply_to: REPLY_TO,
        subject: cleanSubject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return reply(502, { error: `The email could not be sent: ${errText.slice(0, 300)}` });
    }

    // 5. Remember it. The email is already gone, so a failure here must not look like a failed send.
    const { data: saved, error: saveErr } = await db
      .from("lead_replies")
      .insert({ lead_id: lead.id, subject: cleanSubject, body, sent_to: lead.email, sent_by: userData.user.id })
      .select()
      .single();
    if (saveErr) console.error("Reply sent but not saved to history:", saveErr.message);
    if (lead.status === "new") await db.from("leads").update({ status: "contacted" }).eq("id", lead.id);

    return reply(200, { success: true, reply: saved ?? null, historySaved: !saveErr });
  } catch (err) {
    console.error("send-lead-reply error:", err);
    return reply(500, { error: String(err) });
  }
});
