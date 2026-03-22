import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Iowa Auto Trust <noreply@iowaautotrust.com>";

// Called by a cron job (pg_cron or Supabase scheduled function)
serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  // T-5 days reminders
  const t5 = new Date(now);
  t5.setDate(t5.getDate() + 5);

  const { data: appts5 } = await supabase
    .from("appointments")
    .select("id, guest_name, guest_email, service_type, scheduled_at")
    .eq("status", "scheduled")
    .eq("reminder_5d_sent", false)
    .gte("scheduled_at", t5.toISOString().slice(0, 10) + "T00:00:00Z")
    .lte("scheduled_at", t5.toISOString().slice(0, 10) + "T23:59:59Z");

  // T-2 days reminders
  const t2 = new Date(now);
  t2.setDate(t2.getDate() + 2);

  const { data: appts2 } = await supabase
    .from("appointments")
    .select("id, guest_name, guest_email, service_type, scheduled_at")
    .eq("status", "scheduled")
    .eq("reminder_2d_sent", false)
    .gte("scheduled_at", t2.toISOString().slice(0, 10) + "T00:00:00Z")
    .lte("scheduled_at", t2.toISOString().slice(0, 10) + "T23:59:59Z");

  const sendReminder = async (appt: { id: string; guest_name: string; guest_email: string; service_type: string; scheduled_at: string }, daysAway: number) => {
    if (!appt.guest_email) return;
    const dateStr = new Date(appt.scheduled_at).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago",
    });
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1e40af;">Reminder: Appointment in ${daysAway} Day${daysAway > 1 ? "s" : ""}</h2>
        <p>Hi ${appt.guest_name ?? "there"}, just a reminder about your upcoming appointment.</p>
        <p><strong>Service:</strong> ${appt.service_type}</p>
        <p><strong>When:</strong> ${dateStr} (Central)</p>
        <p>Iowa Auto Trust · Woodward, Iowa · (515) 672-5406</p>
      </div>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: appt.guest_email, subject: `Reminder: Your ${appt.service_type} appointment is in ${daysAway} day${daysAway > 1 ? "s" : ""}`, html }),
    });
  };

  for (const appt of (appts5 ?? [])) {
    await sendReminder(appt as never, 5);
    await supabase.from("appointments").update({ reminder_5d_sent: true }).eq("id", appt.id);
  }
  for (const appt of (appts2 ?? [])) {
    await sendReminder(appt as never, 2);
    await supabase.from("appointments").update({ reminder_2d_sent: true }).eq("id", appt.id);
  }

  return new Response(JSON.stringify({ sent5: (appts5 ?? []).length, sent2: (appts2 ?? []).length }), {
    headers: { "Content-Type": "application/json" },
  });
});
