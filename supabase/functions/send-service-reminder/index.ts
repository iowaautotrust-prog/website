import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Iowa Auto Trust <noreply@iowaautotrust.com>";

// Called by a cron job — sends next oil change reminders at T-5 and T-2 days
serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();

  const queryReminders = async (daysAway: number, sentCol: "reminder_5d_sent" | "reminder_2d_sent") => {
    const target = new Date(now);
    target.setDate(target.getDate() + daysAway);
    const dateStr = target.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("service_reminders")
      .select("id, next_service_date, next_service_mileage, customer_id, vehicle_id, shop_customers(name, email), shop_vehicles(make, model, year)")
      .eq(sentCol, false)
      .gte("next_service_date", dateStr)
      .lte("next_service_date", dateStr);

    return data ?? [];
  };

  const sendReminder = async (
    reminder: { id: string; next_service_date: string; next_service_mileage?: number; shop_customers: { name: string; email: string } | null; shop_vehicles: { make: string; model: string; year?: number } | null },
    daysAway: number,
    sentCol: "reminder_5d_sent" | "reminder_2d_sent"
  ) => {
    const cust = reminder.shop_customers;
    const veh = reminder.shop_vehicles;
    if (!cust?.email) return;

    const vehicleStr = veh ? `${veh.year ?? ""} ${veh.make} ${veh.model}`.trim() : "your vehicle";
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1e40af;">Oil Change Reminder</h2>
        <p>Hi ${cust.name ?? "there"}, your next oil change for <strong>${vehicleStr}</strong> is coming up in <strong>${daysAway} day${daysAway > 1 ? "s" : ""}</strong>!</p>
        <p><strong>Recommended service date:</strong> ${reminder.next_service_date}</p>
        ${reminder.next_service_mileage ? `<p><strong>Recommended at:</strong> ${Number(reminder.next_service_mileage).toLocaleString()} miles</p>` : ""}
        <a href="https://iowaautotrust.com/service"
          style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
          Book Appointment
        </a>
        <p style="margin-top:32px;color:#6b7280;font-size:13px;">Iowa Auto Trust · Woodward, Iowa · (515) 672-5406</p>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: cust.email, subject: `Oil Change Reminder – ${daysAway} Day${daysAway > 1 ? "s" : ""} Away`, html }),
    });
    await supabase.from("service_reminders").update({ [sentCol]: true }).eq("id", reminder.id);
  };

  const r5 = await queryReminders(5, "reminder_5d_sent");
  const r2 = await queryReminders(2, "reminder_2d_sent");

  for (const r of r5) await sendReminder(r as never, 5, "reminder_5d_sent");
  for (const r of r2) await sendReminder(r as never, 2, "reminder_2d_sent");

  return new Response(JSON.stringify({ sent5: r5.length, sent2: r2.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
