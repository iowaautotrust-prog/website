// One place that saves a lead and tells the dealership about it.
// Every lead form (contact, interest dialog, request information, test drive) goes through here,
// so every one of them sends the notification email.

import { supabase } from "./supabase";
import { getAttribution } from "./attribution";
import type { Lead } from "./types";

export type NewLead = Omit<Lead, "id" | "created_at" | "lead_source" | "utm_source" | "utm_medium" | "utm_campaign">;

export async function submitLead(lead: NewLead, userId?: string | null): Promise<void> {
  const attribution = getAttribution();
  const row = {
    ...lead,
    user_id: userId ?? lead.user_id ?? null,
    created_at: new Date().toISOString(),
  };
  let { error } = await supabase.from("leads").insert({ ...row, ...attribution });
  if (error && /lead_source|utm_|column/i.test(`${error.message} ${error.code}`)) {
    // The lead_source columns aren't in the database yet (migration not run): never lose a lead.
    ({ error } = await supabase.from("leads").insert(row));
  }
  if (error) throw error;

  // Best effort: the lead is already saved, so a failed email must not fail the form.
  supabase.functions
    .invoke("send-lead-notification", {
      body: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? null,
        vehicleName: lead.vehicle_name ?? null,
        vehicleId: lead.vehicle_id ?? null,
        message: lead.message ?? null,
        leadType: lead.lead_type,
        leadSource: attribution.lead_source,
      },
    })
    .then(({ error }) => {
      if (error) console.warn("Lead saved, but the notification email failed:", error.message);
    })
    .catch(() => {});
}
